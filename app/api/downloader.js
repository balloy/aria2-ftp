/*
Aria2 client wrapper.
For most interfaces, the last 2 parameters are callbacks:
  * onSuccess(item), this callback might be called multiple times on each item.
  * onError(error), error = {item, code, msg}.
*/

import * as random from '../utils/random';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Aria2 = require('aria2');

const nop = () => {};

const onCommonError = (item, err, onError = nop) => {
  console.error(err);
  onError({
    item,
    code: err.code,
    msg: err.message
  });
};

export const startAria2 = async (onSuccess, onError = nop) => {
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
  child.stdout.on('data', data => { if (data.trim().length) console.log(data); });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', err => { console.error(err); onError(err); });

  // handle errors
  child.on('error', err => { console.error(err); onError(err.message); });
  child.on('close', (code) => {
    const msg = `Aria2 deamon exited with code ${code}`;
    console.error(msg);
    onError(msg);
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
        return onSuccess(aria2);
      })
      .catch(err => {
        const msg = `Failed to get Aria2 version, err: ${err}`;
        console.error(msg);
        onError(msg);
      });
  }, 1000);
};

const INTERESTED_KEYS = [
  'gid', 'status', 'totalLength', 'completedLength',
  'dir', 'downloadSpeed', 'files'
];

const getFileName = x => (
  x.files[0].path ?
    // extract from local file path if possible
    path.basename(x.files[0].path) :
    // otherwise extract from uri, however the final file name might
    // need renaming, so add a ? to indicate it's tentative.
    `?${path.basename(x.files[0].uris[0].uri)}`
);


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
const convertItem = x => ({
  gid: x.gid,
  status: x.status,
  name: getFileName(x),
  localDir: x.dir,
  size: parseInt(x.totalLength, 10),
  completedSize: parseInt(x.completedLength, 10),
  speed: x.status === 'active' ? parseInt(x.downloadSpeed, 10) : 0,
  url: x.files[0].uris[0].uri
});

export const startDownloads = (aria2, uris, localDir, onItemAdded, onError = nop) => {
  // prepare options
  const options = {
    dir: localDir,
    // split,
  };
  // for each input URIs, add it to Arir2,
  // then call tellStatus to get its details.
  uris.forEach(x => {
    aria2.addUri([x], options)
      .then(gid => aria2.tellStatus(gid, INTERESTED_KEYS))
      .then(res => onItemAdded(convertItem(res)))
      .catch(err => {
        // create a fake item
        const item = {
          gid: '',
          status: '',
          name: path.basename(x),
          localDir: options.dir,
          size: 0,
          completedSize: 0,
          speed: 0,
          url: x
        };
        onCommonError(item, err, onError);
      });
  });
};

export const refreshDownloads =
(aria2, items, onItemUpdate, onItemComplete = nop, onError = nop) => {
  items.forEach(x => {
    aria2.tellStatus(x.gid, INTERESTED_KEYS)
      .then(res => {
        const newItem = convertItem(res);
        // if status changed to 'complete'
        if ((newItem.status !== x.status) && (newItem.status === 'complete')) {
          onItemComplete(newItem);
        }
        return onItemUpdate(newItem);
      })
      .catch(err => onCommonError(x, err, onError));
  });
};

export const getControlFile = x => (`${x}.aria2`);

export const inDownloadQueue = x => (x.status === 'active' || x.status === 'waiting' || x.status === 'paused');
export const canPause = x => (x.status === 'active' || x.status === 'waiting');
export const canPauseAll = items => (items.find(x => canPause(x)));
export const canResume = x => (x.status === 'paused');
export const canResumeAll = items => (items.find(x => canResume(x)));
export const canCancel = inDownloadQueue;   // alias
export const canCancelAll = items => (items.find(x => canCancel(x)));

export const pauseItem = (aria2, item, onItemPaused = nop, onError = nop) => {
  aria2.pause(item.gid)
    .then(() => {
      const x = { ...item, status: 'paused' };
      return onItemPaused(x);
    })
    .catch(err => onCommonError(item, err, onError));
};
export const pauseAll = (aria2, items, onItemPaused = nop, onError = nop) => {
  items.filter(canPause).forEach(x => pauseItem(aria2, x, onItemPaused, onError));
};

export const resumeItem = (aria2, item, onItemResumed = nop, onError = nop) => {
  aria2.unpause(item.gid)
    .then(() => {
      const x = { ...item, status: 'waiting' };
      return onItemResumed(x);
    })
    .catch(err => onCommonError(item, err, onError));
};
export const resumeAll = (aria2, items, onItemResumed = nop, onError = nop) => {
  items.filter(canResume).forEach(x => resumeItem(aria2, x, onItemResumed, onError));
};

export const cancelItem = (aria2, item, onItemCancelled = nop, onError) => {
  aria2.forceRemove(item.gid)
    .then(() => {
      // remove local files
      fs.unlinkSync(path.join(item.localDir, item.name));
      fs.unlinkSync(path.join(item.localDir, getControlFile(item.name)));
      return onItemCancelled(item);
    })
    .catch(err => onCommonError(item, err, onError));
};
export const cancelAll = (aria2, items, onItemCancelled = nop, onError = nop) => {
  items.filter(canCancel).forEach(x => cancelItem(aria2, x, onItemCancelled, onError));
};
