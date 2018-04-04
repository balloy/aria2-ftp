
import { getDownloadSuggestions, downloadQueueEmpty } from '../../app/actions/app';
import { Downloader } from '../../app/api/downloader';
import { TYPE_FOLDER } from '../../app/utils/fileType';

const createDownloader = downloads => {
  const downloader = new Downloader();
  downloader.downloads = downloads;
  return downloader;
};

const mockAction = (action, state) => action()(null, () => state);

describe('actions/app', () => {
  describe('getDownloadSuggestions', () => {
    it('should return correct download suggestions', () => {
      // prepare test data
      const state = {
        localDir: {
          items: [
            { name: '2.incomplete', size: 500000 },
            { name: '4.dsize', size: 1200 },
            { name: '6.downloaded', size: 4200 },
            { name: '2.incomplete.aria2', size: 10 },
            { name: '7.dummy', size: 100 },
          ]
        },
        ftp: {
          address: 'ftp://a.com',
          dir: '/test',
          items: [
            { name: '0.waiting', size: 200 },
            { name: '1.new', size: 100 },
            { name: '2.incomplete', size: 500000 },
            { name: '3.active', size: 5000 },
            { name: '4.dsize', size: 2000 },
            { name: '5.ignore', size: 2000, type: TYPE_FOLDER },
            { name: '6.downloaded', size: 4200 },
            { name: '7.paused', size: 100 },
            { name: '8.complete', size: 1200 },
          ]
        },
        downloader: createDownloader([
          { url: 'ftp://a.com/test/0.waiting', status: 'waiting' },
          { url: 'ftp://a.com/test/3.active', status: 'active' },
          { url: 'ftp://a.com/test/5.dummy', status: 'active' },
          { url: 'ftp://a.com/test/7.paused', status: 'paused' },
          { url: 'ftp://a.com/test/8.complete', status: 'complete' },
        ])
      };

      // build expected results
      const suggestions = [
        'downloading',
        'new',
        'incomplete download',
        'downloading',
        'different size',
        'ignore',
        'downloaded',
        'downloading',
        'new'
      ];
      const shouldDownloads = [false, true, true, false, true, false, false, false, true];

      const expected = state.ftp.items.map((x, index) => ({
        ...x,
        suggestion: suggestions[index],
        shouldDownload: shouldDownloads[index]
      }));
      expect(mockAction(getDownloadSuggestions, state)).toEqual(expected);
    });
  });

  describe('downloadQueueEmpty', () => {
    it('should return correct value with different queues', () => {
      // empty
      const state = { downloader: createDownloader([]) };
      expect(mockAction(downloadQueueEmpty, state)).toBe(true);

      // 1 active + 1 completed
      state.downloader.downloads = [{ status: 'active' }, { status: 'completed' }];
      expect(mockAction(downloadQueueEmpty, state)).toBe(false);

      // 1 complete
      state.downloader.downloads = [{ status: 'completed' }];
      expect(mockAction(downloadQueueEmpty, state)).toBe(true);

      // 1 paused
      state.downloader.downloads = [{ status: 'paused' }];
      expect(mockAction(downloadQueueEmpty, state)).toBe(false);
    });
  });
});
