/*
Utilities to operate local FileSystem.
*/
import { getFileType, TYPE_FOLDER } from '../utils/fileType';

const fs = require('fs');
const path = require('path');


export const readDir = inputDir => new Promise((resolve, reject) => {
  let dir = inputDir;

  // solve the dir to absolute path
  // for windows drive like 'C:'
  if (dir.slice(-1) === ':') dir += '\\';
  dir = path.resolve(dir);
  console.log(`Begin loading folder: ${dir}`);

  fs.readdir(dir, (error, files) => {
    if (error) {
      console.warn(error);
      return reject(error.message);
    }

    // extract needed fields
    const items = files.map(x => getFileStat(path.join(dir, x)));

    console.log(`Local files under dir[${dir}]:`, items);

    resolve({ dir, items });
  });
});

const getFileStat = filepath => {
  const result = {
    name: path.basename(filepath),
    path: path.resolve(filepath),
  };

  try {
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      result.type = TYPE_FOLDER;
    } else {
      result.type = getFileType(filepath);
      result.size = stat.size;
    }
    result.modified = stat.mtime;
  } catch (e) {
    console.log(e);
  }

  return result;
};
