/* eslint no-param-reassign: 0 */
/*
FTP client wrapper.
*/

import { joinURL } from '../utils/ftpUrl';
import { getFileType, TYPE_FOLDER } from '../utils/fileType';

const { URL } = require('url');
const Jsftp = require('jsftp');

export const connect = url => {
  const p = new URL(url);
  console.log('ftp url:', p);
  return new Promise((resolve, reject) => {
    const ftpClient = new Jsftp({
      host: p.hostname,
      port: p.port || 21,
      user: p.username || 'anonymous',
      pass: p.password || '@anonymous',
    });

    ftpClient.on('connect', () => resolve(ftpClient));
    ftpClient.on('error', err => {
      console.error(err);
      reject(err.message);
    });
  });
};

export const disconnect = ftpClient => {
  ftpClient.raw('quit', (err, data) => {
    // ignore any err here.
    console.log(`FTP connection closed. err: ${err}, data: `, data);
    ftpClient.destroy();
  });
};

// convert text from '20180307034854' to Date
const parseMDTMDate = t => (
  new Date(Date.UTC(
    t.substr(0, 4),
    parseInt(t.substr(4, 2), 10) - 1,   // month range is 0-11
    t.substr(6, 2),
    t.substr(8, 2),
    t.substr(10, 2),
    t.substr(12, 2)
  ))
);

// calculate the time differnce of FTP 'LIST' command data and 'MDTM' command data
const calculateTimeDifference = (listData, mdtmData) => {
  const t1 = new Date(listData.time);
  const t2 = parseMDTMDate(mdtmData.text.split(' ').pop());
  console.log(`LIST file modified time: ${t1}`);
  console.log(`MDTM file modified time: ${t2}`);

  // ignore seconds diffrenece.
  // because LIST result doesn't include second, but MDTM does.
  t1.setSeconds(0);
  t2.setSeconds(0);
  const timeDifference = t2.getTime() - t1.getTime();
  console.log(`Time difference in hours: ${timeDifference / 1000 / 3600}`);

  return timeDifference;
};

const resolveItems = (resolve, dir, rawItems, timeDiff) => {
  // extract needed fields
  const items = rawItems.map(x => ({
    name: x.name,
    path: joinURL(dir, x.name),
    type: x.type === 1 ? TYPE_FOLDER : getFileType(x.name),
    size: x.type === 1 ? undefined : parseInt(x.size, 10),
    modified: new Date(x.time + timeDiff),
  }));
  console.log(`FTP files under dir[${dir}]:`, items);

  resolve({ dir, items });
};

export const readDir = (ftpClient, inputDir) => new Promise((resolve, reject) => {
  const dir = inputDir || '/';

  console.log(`Begin loading FTP folder: ${dir}`);
  ftpClient.ls(dir, (error, items) => {
    if (error) {
      console.warn(error);
      return reject(error.message);
    }

    // check FTP server time differnce if needed
    if (   (!ftpClient.hasFeat('mdtm'))  // doesn't support MDTM.
        || (ftpClient.timeDiff !== undefined)  // got result already.
        || (!items.length)    // empty folder, no file to send MDTM.
    ) {
      return resolveItems(resolve, dir, items, ftpClient.timeDiff || 0);
    }

    // send MDTM command for one file to get the time differnce.
    const p = joinURL(dir, items[0].name);
    console.log(`Got file list, check server timezone via MDTM ${p}`);

    ftpClient.raw('MDTM', p, (err, data) => {
      let diff = 0;
      if (err || data.isError) {
        console.log('MDTM error, simply ignore.');
      } else {
        diff = calculateTimeDifference(items[0], data);
      }

      // store the timeDiff, we only need to do it once per connection.
      ftpClient.timeDiff = diff;
      return resolveItems(resolve, dir, items, diff);
    });
  });
});
