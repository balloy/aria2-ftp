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
      // split lines
      const data = listing.split('\r\n');
      const list = [];
      for (let i = 0; i < data.length; ++i) {
        const facts = data[i].split(';');
        // console.log('facts: ', facts);

        // convert facts array to dict, ref: https://tools.ietf.org/html/rfc3659.html#section-7.2
        /*
          sample facts format:
          [ 'type=dir',
            'sizd=13',
            'modify=20181006014050',
            ...
            ' test folder' ]
        */
        const item = {};
        for (let j = 0; j < facts.length; ++j) {
          const fact = facts[j];
          if (fact[0] === ' ') {
            // RFC: entry            = [ facts ] SP pathname
            // first char space, this is actually the entry(path name) not a fact.
            item.name = fact.substr(1);
          } else {
            // RFC: fact             = factname "=" value
            const fe = fact.indexOf('='); // doing this way - rather than split - in case there can be an "=" in the fact value
            if (fe > 0) { // if nothing before the = - not really usable anyway
              const factname = fact.substr(0, fe).toLowerCase();
              const factvalue = fact.substr(fe + 1);
              item[factname] = factvalue;
            }
          }
        }
        // console.log('item: ', item);


        // ignore empty item, . and ..
        if (item.type && item.type !== 'cdir' && item.type !== 'pdir') {
          const str2date = timeVal => {
            const p = timeVal.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\.\d+)?$/);
            const millis = p[7] ? p[7] : 0;
            return Date.UTC(p[1], p[2] - 1, p[3], p[4], p[5], p[6], millis);
          };

          /*
            sample target format:
            [{
              name: 'sample_folder',
              type: 1,
              time: 1538842500000,
              size: '12',
             },
            ]
          */
          list.push({
            name: item.name,
            type: item.type === 'dir' ? 1 : 0,
            time: str2date(item.modify),
            size: item.size || item.sizd
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

export const readDir = (ftpClient, inputDir) => new Promise((resolve, reject) => {
  const dir = inputDir || '/';

  console.log(`Begin loading FTP folder: ${dir}`);

  // change dir first then call ls/msld, otherwise may fail handling paths with space.
  ftpClient.raw('CWD', dir, error => {
    if (error) {
      console.warn(error);
      return reject(error.message);
    }

    const func = ftpClient.hasFeat('mlsd') ? readDirMLSD : readDirLS;
    return func(ftpClient, dir, resolve, reject);
  });
});

const readDirMLSD = (ftpClient, dir, resolve, reject) => {
  console.log('Using MLSD');
  ftpClient.mlsd('', (error, items) => {
    if (error) {
      console.warn(error);
      return reject(error.message);
    }
    return resolveItems(resolve, dir, items, 0);
  });
};

const readDirLS = (ftpClient, dir, resolve, reject) => {
  console.log('Using LS');
  ftpClient.ls('.', (error, items) => {
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
};
