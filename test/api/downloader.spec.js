import { Downloader } from '../../app/api/downloader';

const path = require('path');
const fs = require('fs');

const LOCAL_DIR = './test_temp';

// @todo: use docker with pureftpd?
const REMOTE_URLS = [
  'ftp://speedtest.tele2.net:21/1KB.zip',
  'ftp://speedtest.tele2.net:21/1MB.zip',
  'ftp://speedtest.tele2.net:21/10MB.zip',
];

const SMALL_FILE_REMOTE_URL = 'ftp://speedtest.tele2.net:21/1KB.zip';
const LARGE_FILE_REMOTE_URL = 'ftp://speedtest.tele2.net:21/100MB.zip';

// remove dir and its contents (sub-dir removal is not supported)
const removeDir = dir => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      fs.unlinkSync(path.join(dir, file));
    });
    fs.rmdirSync(dir);
  }
};

describe('downloader', () => {
  let downloader;
  beforeAll(async (done) => {
    console.log('--------Download Testing, START----------');
    removeDir(LOCAL_DIR);
    fs.mkdirSync(LOCAL_DIR);  // prepare local dir
    downloader = await Downloader.init();  // init downloader
    done();
  });

  afterAll(() => {
    console.log('--------Download Testing, END------------');
    removeDir(LOCAL_DIR);
  });

  describe('Downloader.init()', () => {
    it('should be able to init multiple instances', async (done) => {
      const tasks = [];
      for (let i = 0; i < 5; ++i) {
        tasks.push(Downloader.init());
      }

      const downloaders = await Promise.all(tasks);
      downloaders.forEach(x => {
        expect(x).toBeInstanceOf(Downloader);
      });
      done();
    });
  });

  describe('addDownloads', () => {
    it('should be able to add downloads', done => {
      downloader.on('item-added', (item) => {
        expect(item.gid.length).toBeGreaterThan(0);
        expect(item.localDir).toBe(LOCAL_DIR);
        if (downloader.getDownloads().length === REMOTE_URLS.length) {
          done();
        }
      });
      downloader.addDownloads(REMOTE_URLS, LOCAL_DIR);
    });

    it('should report error on invalid url', done => {
      downloader.on('item-add-failed', ({ item, code, msg }) => {
        expect(item).not.toBeNull();
        expect(code).not.toBe(0);
        expect(msg.length).toBeGreaterThan(0);
        done();
      });
      // pass an invalid url
      downloader.addDownloads(['not-url'], LOCAL_DIR);
    });

    it('should be able to handle both valid and invalid url in a call', done => {
      let handled = 0;
      downloader.on('item-added', (item) => {
        expect(item.gid.length).toBeGreaterThan(0);
        handled += 1;
        if (handled === 2) done();
      });
      downloader.on('item-add-failed', ({ msg }) => {
        expect(msg.length).toBeGreaterThan(0);
        handled += 1;
        if (handled === 2) done();
      });
      // pass an invalid url + a vaild url
      // should emit 2 events, 1 'item-added' + 1 'item-add-failed'
      downloader.addDownloads(['not-url', REMOTE_URLS[0]], LOCAL_DIR);
    });

    // cancel the downloads added previously
    it('should be able to cancel all downloads', done => {
      expect(downloader.canCancelAll()).toBe(true);
      expect.hasAssertions();
      downloader.on('item-cancelled', item => {
        expect(item.gid.length).toBeGreaterThan(0);

        // wait until all downloads been cancelled
        if (downloader.getDownloads.length === 0) done();
      });
      downloader.cancelAll();
    });
  });

  describe('refresh', () => {
    it('should be able to report status, including download completed', done => {
      const refresh = setInterval(() => {
        downloader.refresh();
      }, 200);
      downloader.on('item-completed', (item) => {
        expect(item.size).toBeGreaterThan(0);
        clearInterval(refresh);
        done();
      });
      downloader.addDownloads([SMALL_FILE_REMOTE_URL], LOCAL_DIR);
    });
  });

  describe('pause/resume/cancel', () => {
    let testItem = null;
    it('should receive change/item-update, and be able to pause', done => {
      // run refresh schedulely to trigger 'item-updated'
      const refresh = setInterval(() => {
        downloader.refresh();
      }, 200);
      downloader.on('change', items => {
        expect(items.length).toBeGreaterThan(0);
      });
      downloader.on('item-updated', (item) => {
        // wait a while until download starts
        if (item.status === 'active') {
          expect(downloader.canPause(item)).toBe(true);
          expect(downloader.canPauseAll()).toBe(true);
          expect(downloader.canResume(item)).toBe(false);
          expect(downloader.canResumeAll()).toBe(false);
          expect(downloader.canCancel(item)).toBe(true);
          expect(downloader.canCancelAll()).toBe(true);
          downloader.pause(item);
        }
      });
      downloader.on('item-paused', (item) => {
        expect(item.status).toBe('paused');
        expect(downloader.canResume(item)).toBe(true);
        expect(downloader.canResumeAll()).toBe(true);
        expect(downloader.canCancel(item)).toBe(true);
        expect(downloader.canCancelAll()).toBe(true);
        clearInterval(refresh);
        testItem = item;
        done();
      });
      downloader.addDownloads([LARGE_FILE_REMOTE_URL], LOCAL_DIR);
    });

    it('should be able to resume', done => {
      downloader.on('item-resumed', (item) => {
        expect(downloader.canPause(item)).toBe(true);
        expect(downloader.canPauseAll()).toBe(true);
        expect(downloader.canCancel(item)).toBe(true);
        expect(downloader.canCancelAll()).toBe(true);
        done();
      });
      downloader.resume(testItem);
    });

    it('should be able to cancel', done => {
      downloader.on('item-cancelled', () => {
        expect(downloader.getDownloads.length).toBe(0);
        done();
      });
      downloader.cancel(testItem);
    });
  });

  describe('DownloadOptions', () => {
    it('should be able to add/update download options', () => {
      downloader.setDownloadOptions({ split: 3 });
      expect(downloader.getDownloadOptions()).toHaveProperty('split', 3);
      downloader.setDownloadOptions({ t1: 'a', t2: 2 });
      expect(downloader.getDownloadOptions()).toHaveProperty('t1', 'a');
      expect(downloader.getDownloadOptions()).toHaveProperty('t2', 2);
      expect(downloader.getDownloadOptions()).toHaveProperty('split', 3);
      downloader.setDownloadOptions({ split: 7, t2: 20 });
      expect(downloader.getDownloadOptions()).toHaveProperty('t1', 'a');
      expect(downloader.getDownloadOptions()).toHaveProperty('t2', 20);
      expect(downloader.getDownloadOptions()).toHaveProperty('split', 7);
    });
  });
});
