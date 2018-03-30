import { joinURL } from '../utils/ftpUrl';
import { TYPE_FOLDER } from '../utils/filetype';

/*
For each file in ftpItems, give download suggestions based on the status of
existing downloads and local files.

Return a copy of ftpItems, with 2 fields added:
suggestion: string, possible status includes,
  - 'new': not in local or download queue
  - 'downloading': already in download queue
  - 'incomplete download': has been downloaded previously but didn't complete
  - 'different size': local file exists but differnt size
  - 'ignore': for folder, ignore checking the status
  - 'downloaded': already downloaded successfully
shouldDownload: boolean
*/
export const getDownloadSuggestions = () => (dispatch, getState) => {
  const { localDir, ftp, downloader } = getState();
  // convert arrays to map to speed up item looking up
  const localMap = localDir.items.reduce((map, obj) => ({ ...map, [obj.name]: obj }), {});
  const downloadMap = downloader.getDownloads()
    .reduce((map, obj) => ({ ...map, [obj.url]: obj }), {});

  const urlBase = joinURL(ftp.address, ftp.dir);

  // calculate the suggestions
  const suggestions = ftp.items.map(x => {
    // ignore folders
    if (x.type === TYPE_FOLDER) return 'ignore';

    // if the url already exists in download queue
    if (joinURL(urlBase, x.name) in downloadMap) {
      const item = downloadMap[joinURL(urlBase, x.name)];
      if (downloader.isDownloading(item)) return 'downloading';
    }

    // if no local file with same name
    if (!(x.name in localMap)) return 'new';

    // if there's local file with same name, and .aria2 file
    if ((downloader.getControlFile(x.name)) in localMap) return 'incomplete download';

    // if there's local file with same name but different size
    if (x.size !== localMap[x.name].size) return 'different size';

    return 'downloaded';
  });

  // add the fields then return
  return ftp.items.map((x, index) => ({
    ...x,
    suggestion: suggestions[index],
    shouldDownload: suggestions[index] === 'new'
      || suggestions[index] === 'incomplete download'
      || suggestions[index] === 'different size'
  }));
};

// whether current download queue is empty
export const downloadQueueEmpty = () => (dispatch, getState) => {
  const { downloader } = getState();
  return !downloader.canCancelAll();
};
