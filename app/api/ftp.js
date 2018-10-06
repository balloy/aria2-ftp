/* eslint no-param-reassign: 0 */
/*
FTP client wrapper.
*/

import { joinURL } from '../utils/ftpUrl';
import { getFileType, TYPE_FOLDER } from '../utils/fileType';

const { URL } = require('url');
const Jsftp = require('jsftp');

const once = require('once');

// add mlsd support
Jsftp.prototype.mlsd = function mlsd(path, callback) {
  const self = this;
  let listing = '';
  callback = once(callback);

  self.getPasvSocket( (error, socket) => {
    if (error) {
      return callback(error);
    }

    socket.setEncoding('utf8');
    socket.on('data', data => { listing += data; });

    self.pasvTimeout(socket, callback);

    socket.once('close', err => {
      // Split lines
      const data = listing.split('\r\n');
      const list = [];
      for (let i = 0; i < data.length; ++i) {
        const line = data[i].split(';');
        // console.log('line: ', line);

        // Remove empty item, . and ..
        if (line.length >= 7 && line[0] !== 'type=cdir' && line[0] !== 'type=pdir') {
          /*
            sample line format:
            [ 'type=dir',
              'sizd=13',
              'modify=20181006014050',
              'UNIX.mode=0775',
              'UNIX.uid=1000',
              'UNIX.gid=1000',
              'unique=49g65ca',
              ' [EAC][180926] Summer Pockets Original SoundTrack [FLAC+CUE+LOG+TIF]'
            ]
            sample target format:
            [{
              name: 'sample_folder',
              type: 1,
              time: 1538842500000,
              size: '12',
             },
            ]
          */

          const str2date = timeVal => {
            const p = timeVal.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\.\d+)?$/);
            const millis = p[7] ? p[7] : 0;
            return Date.UTC(p[1], p[2] - 1, p[3], p[4], p[5], p[6], millis);
          };

          list.push({
            name: line[7].substr(1),  // remove first space
            type: line[0] === 'type=dir' ? 1 : 0,
            time: str2date(line[2].replace('modify=', '')),
            size: line[1].replace('size=', '').replace('sizd=', '')
          });
        }
      }
      callback(err, list);
    });

    socket.once('error', callback);

    const cmdCallback = (err, res) => {
      if (err) {
        return callback(err);
      }

      const expectedMarks = {
        marks: [150, 226],
        ignore: 226
      };
      const isExpectedMark = expectedMarks.marks.some( mark => mark === res.code );
      if (!isExpectedMark) {
        callback(new Error(`Expected marks ${expectedMarks.toString()} instead of: ${res.text}`));
      }
    };
    self.execute(`MLSD ${path || ''}`, cmdCallback);
  });
};

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

    ftpClient.on('connect', () => {
      // get Feature List after connection established,
      // since we prefer to use MLSD so need to know whether it's supported.
      ftpClient.getFeatures((err) => {
        if (err) {
          reject(err.message);
        } else {
          resolve(ftpClient);
        }
      });
    });

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

export const readDir = (ftpClient, inputDir) => {
  const dir = inputDir || '/';

  console.log(`Begin loading FTP folder: ${dir}`);
  const func = ftpClient.hasFeat('mlsd') ? readDirMLSD : readDirLS;
  return func(ftpClient, dir);
};

const readDirMLSD = (ftpClient, dir) => new Promise((resolve, reject) => {
  console.log('Using MLSD');
  ftpClient.raw('CWD', dir, error => {
    if (error) {
      console.warn(error);
      return reject(error.message);
    }

    ftpClient.mlsd('', (error2, items) => {
      if (error2) {
        console.warn(error2);
        return reject(error2.message);
      }
      return resolveItems(resolve, dir, items, 0);
    });
  });
});

const readDirLS = (ftpClient, dir) => new Promise((resolve, reject) => {
  console.log('Using LS');
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
