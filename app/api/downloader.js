/* eslint class-methods-use-this: 0 */
/*
Aria2 client wrapper. Provide download APIs and maintain the download queue.
*/

import * as random from '../utils/random';

const EventEmitter = require( 'events' );
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Aria2 = require('aria2');

export class Downloader extends EventEmitter {
  constructor(aria2) {
    super();
    this.aria2 = aria2;
    this.downloads = [];
    this.downloadOptions = {};
  }

  // return a Promise, with a Downloader instance.
  // retry a few times, just in case the port been occupied during starting aria2
  static init(retries = 5) {
    return new Promise((resolve, reject) => {
      this.tryInit()
        .then(downloader => resolve(downloader))
        .catch(err => (retries > 1 ? resolve(this.init(retries - 1)) : reject(err)));
    });
  }

  // return a Promise, with a Downloader instance.
  static tryInit() {
    return new Promise(async (resolve, reject) => {
      // use random port/secret to enhance security, and allow multiple instances
      // run simultaneously.
      const port = await random.getRandomPort();
      const secret = random.getRandomString(16);

      // prepare options for both Aria2 deamon and client.
      const options = {
        secure: false,
        host: 'localhost',
        port,
        secret,
        path: '/jsonrpc'
      };
      console.log(`Attempt to start Aria2 deamon at port ${port}`);

      // start aria2c
      const child = spawn('./aria2/aria2c', [
        '--conf-path', './aria2/aria2.conf',
        '--rpc-listen-port', options.port,
        '--rpc-secret', options.secret,
      ]);

      // simply log stdout/sterr outputs to console.
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', data => { if (data.trim().length) console.debug(data); });
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', err => { console.error(err); reject(err); });

      // handle errors
      child.on('error', err => { console.error(err); reject(err.message); });
      child.on('close', (code) => {
        const msg = `Aria2 deamon exited with code ${code}`;
        console.error(msg);
        reject(msg);
      });

      // wait some time to make sure aria2c started.
      setTimeout(() => {
        // create a aria2c client
        const aria2 = new Aria2(options);

        // test connection
        aria2.open()
          .then(() => aria2.getVersion())
          .then(res => {
            console.log(`Aria2 deamon started on port ${options.port}, secret: ${options.secret}`);
            console.log(`Aria2 version: ${res.version}`);
            return resolve(new Downloader(aria2));
          })
          .catch(err => {
            const msg = `Failed to get Aria2 version, err: ${err}`;
            console.error(msg);
            reject(msg);
          });
      }, 500);
    });
  }

  getDownloads() {
    return this.downloads;
  }

  setDownloadOptions(options) {
    this.downloadOptions = {
      ...this.downloadOptions,
      ...options
    };
  }
  getDownloadOptions() {
    return this.downloadOptions;
  }

  getFileName(item) {
    return item.files[0].path ?
      // extract from local file path if possible
      path.basename(item.files[0].path) :
      // otherwise extract from uri, however the final file name might
      // need renaming, so add a ? to indicate it's tentative.
      `?${path.basename(item.files[0].uris[0].uri)}`;
  }

  // fields used by tellStatus
  INTERESTED_KEYS = [
    'gid', 'status', 'totalLength', 'completedLength',
    'dir', 'downloadSpeed', 'files'
  ];

  /* Status:
  https://aria2.github.io/manual/en/html/aria2c.html#aria2.tellStatus
  active for currently downloading/seeding downloads.
  waiting for downloads in the queue;download is not started.
  paused for paused downloads.
  error for downloads that were stopped because of error.
  complete for stopped and completed downloads.
  removed for the downloads removed by user.
  */
  // convert arai2 tellStatus download item to our format.
  convertItem(x) {
    return {
      gid: x.gid,
      status: x.status,
      name: this.getFileName(x),
      localDir: x.dir,
      size: parseInt(x.totalLength, 10),
      completedSize: parseInt(x.completedLength, 10),
      speed: x.status === 'active' ? parseInt(x.downloadSpeed, 10) : 0,
      url: x.files[0].uris[0].uri
    };
  }

  emitError(event, item, err) {
    console.warn(event, err);
    this.emit(event, {
      item,
      code: err.code,
      msg: err.message
    });
  }

  emitChange(event, item) {
    switch (event) {
      case 'item-added':
        this.downloads = [...this.downloads, item];
        break;
      case 'item-cancelled':
        this.downloads = this.downloads.filter(x => (x.gid !== item.gid));
        break;
      default:
        this.downloads = this.downloads.map(x => ((x.gid === item.gid) ? item : x));
        break;
    }
    this.emit(event, item);
    this.emit('change', this.downloads);
  }

  addDownloads(uris, localDir) {
    // prepare options
    const options = {
      ...this.downloadOptions,
      dir: localDir,
    };
    console.log('downloadOptions:', options);
    // for each input URIs, add it to Arir2,
    // then call tellStatus to get its details.
    uris.forEach(url => {
      this.aria2.addUri([url], options)
        .then(gid => this.aria2.tellStatus(gid, this.INTERESTED_KEYS))
        .then(res => {
          const item = this.convertItem(res);
          return this.emitChange('item-added', item);
        })
        .catch(err => {
          // create a fake item
          const item = {
            gid: '',
            status: '',
            name: path.basename(url),
            localDir: options.dir,
            size: 0,
            completedSize: 0,
            speed: 0,
            url
          };
          this.emitError('item-add-failed', item, err);
        });
    });
  }

  refresh() {
    this.downloads.forEach(item => {
      this.aria2.tellStatus(item.gid, this.INTERESTED_KEYS)
        .then(res => {
          const newItem = this.convertItem(res);
          // if status changed to 'complete'
          if ((newItem.status !== item.status) && (newItem.status === 'complete')) {
            this.emitChange('item-completed', newItem);
          }
          return this.emitChange('item-updated', newItem);
        })
        .catch(err => this.emitError('item-update-failed', item, err));
    });
  }

  getControlFile = file => (`${file}.aria2`);

  isDownloading = x => (x.status === 'active' || x.status === 'waiting' || x.status === 'paused');

  canPause = x => (x.status === 'active' || x.status === 'waiting');
  canPauseAll = () => this.downloads.some(x => this.canPause(x));
  canResume = x => (x.status === 'paused');
  canResumeAll = () => this.downloads.some(x => this.canResume(x));
  canCancel = this.isDownloading;   // alias
  canCancelAll = () => this.downloads.some(x => this.canCancel(x));

  pause(item) {
    this.aria2.pause(item.gid)
      .then(() => {
        const x = { ...item, status: 'paused' };
        return this.emitChange('item-paused', x);
      })
      .catch(err => this.emitError('item-pause-failed', item, err));
  }
  pauseAll = () => this.downloads.filter(this.canPause).forEach(this.pause.bind(this));

  resume(item) {
    this.aria2.unpause(item.gid)
      .then(() => {
        const x = { ...item, status: 'waiting' };
        return this.emitChange('item-resumed', x);
      })
      .catch(err => this.emitError('item-resume-failed', item, err));
  }
  resumeAll = () => this.downloads.filter(this.canResume).forEach(this.resume.bind(this));

  cancel(item) {
    this.aria2.forceRemove(item.gid)
      .then(() => {
        // Will emit 2 events.
        //  First 'item-removed', means it's removed from the download queue.
        //  Seconds 'item-cancelled', means the cleanup job done.
        const x = { ...item, status: 'removed' };
        this.emitChange('item-removed', x);

        // delay the control file deleting a few seconds to avoid sharing violation.
        return setTimeout(() => {
          // remove local files
          try {
            fs.unlinkSync(path.join(item.localDir, item.name));
            fs.unlinkSync(path.join(item.localDir, this.getControlFile(item.name)));
          } catch (err) {
            // ignore
          }

          this.emitChange('item-cancelled', x);
        }, 500);
      })
      .catch(err => this.emitError('item-cancel-failed', item, err));
  }
  cancelAll = () => this.downloads.filter(this.canCancel).forEach(this.cancel.bind(this));
}
