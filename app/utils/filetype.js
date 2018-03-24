/*
Convert file extention to file type or fontawesome icon.
*/

export const TYPE_FOLDER = '[folder]';

// simple use extension as type
export const getFileType = file => (
  // file -> get name without folder -> get extension without name
  file.split(/[\\/]/).pop().split('.').pop()
);

// todo: use a new set of file icons.
// define the file type -> extensions table
const iconTypes = {
  archive:    ['zip', 'rar', 'gz', '7z'],
  audio:      ['mp3', 'wav', 'aac', 'ogg'],
  code:       ['c', 'h', 'cpp', 'hpp', 'java', 'cs', 'py', 'js', 'css', 'html', 'htm', 'aspx', 'php', 'jsp'],
  excel:      ['xls', 'xlsx'],
  image:      ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
  pdf:        ['pdf'],
  powerpoint: ['ppt', 'pptx'],
  text:       ['txt', 'md'],
  video:      ['mkv', 'avi', 'rmvb', 'mp4', 'flv'],
  word:       ['doc', 'docx'],
};

// convert it to extension(type) -> iconType map.
const map = {};
for (let type in iconTypes) {
  iconTypes[type].forEach(ext => { map[ext] = type; });
}

// type => icon
export const getTypeIcon = type => {
  if (type === TYPE_FOLDER) {
    return 'folder';
  } else if (type in map) {
    return `file-${map[type]}`;
  }
  return 'file';   // for unknown file types
};
