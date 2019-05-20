/*
Convert file extention to file type or fontawesome icon.
*/

export const TYPE_FOLDER = '[folder]';

// simple use extension as type
export const getFileType = file => (
  // file -> get name without folder -> get extension without name
  file.split(/[\\/]/).pop().split('.').pop()
);

// define know types, type list came from /app/assets/icons/classic
const knownTypes = new Set([
  '3g2', '3ga', '3gp', '7z', 'aa', 'aac', 'accdb', 'accdt', 'adn', 'ai', 'aif', 'aifc', 'aiff', 'ait', 'amr', 'ani', 'apk', 'app', 'asax', 'ascx', 'asf', 'ash', 'ashx', 'asmx', 'asp', 'aspx', 'asx', 'au', 'aup', 'avi', 'axd', 'aze', 'bash', 'bat', 'bin', 'blank', 'bmp', 'bpg', 'browser', 'bz2', 'c', 'cab', 'caf', 'cal', 'cd', 'cer', 'class', 'cmd', 'com', 'compile', 'config', 'cpp', 'cr2', 'crt', 'crypt', 'cs', 'csh', 'csproj', 'css', 'csv', 'cue', 'dat', 'db', 'dbf', 'deb', 'dgn', 'dll', 'dmg', 'dng', 'doc', 'docb', 'docm', 'docx', 'dot', 'dotm', 'dotx', 'dpj', 'dtd', 'dwg', 'dxf', 'eot', 'eps', 'epub', 'exe', 'f4v', 'fax', 'fb2', 'fla', 'flac', 'flv', 'folder', 'gadget', 'gem', 'gif', 'gitignore', 'gpg', 'gz', 'h', 'htm', 'html', 'ibooks', 'ico', 'ics', 'idx', 'iff', 'image', 'img', 'indd', 'inf', 'ini', 'iso', 'jar', 'java', 'jpe', 'jpeg', 'jpg', 'js', 'json', 'jsp', 'key', 'kf8', 'ksh', 'less', 'licx', 'lit', 'log', 'lua', 'm2v', 'm3u', 'm3u8', 'm4a', 'm4r', 'm4v', 'master', 'md', 'mdb', 'mdf', 'mid', 'midi', 'mkv', 'mobi', 'mov', 'mp2', 'mp3', 'mp4', 'mpa', 'mpd', 'mpe', 'mpeg', 'mpg', 'mpga', 'mpp', 'mpt', 'msi', 'msu', 'nef', 'nes', 'odb', 'odt', 'ogg', 'ogv', 'ost', 'otf', 'ott', 'ovf', 'p12', 'p7b', 'pages', 'part', 'pcd', 'pdb', 'pdf', 'pem', 'pfx', 'pgp', 'php', 'png', 'po', 'pot', 'potx', 'pps', 'ppsx', 'ppt', 'pptm', 'pptx', 'prop', 'ps', 'psd', 'psp', 'pst', 'pub', 'py', 'qt', 'ra', 'ram', 'rar', 'raw', 'rb', 'rdf', 'resx', 'rm', 'rpm', 'rtf', 'rub', 'sass', 'scss', 'sdf', 'sh', 'sitemap', 'skin', 'sldm', 'sldx', 'sln', 'sql', 'step', 'stl', 'svg', 'swd', 'swf', 'swift', 'sys', 'tar', 'tcsh', 'tex', 'tga', 'tgz', 'tif', 'tiff', 'torrent', 'ts', 'tsv', 'ttf', 'txt', 'udf', 'vb', 'vbproj', 'vcd', 'vcs', 'vdi', 'vdx', 'vmdk', 'vob', 'vsd', 'vss', 'vst', 'vsx', 'vtx', 'war', 'wav', 'wbk', 'webinfo', 'webm', 'webp', 'wma', 'wmf', 'wmv', 'woff', 'woff2', 'wsf', 'xaml', 'xcf', 'xlm', 'xls', 'xlsm', 'xlsx', 'xlt', 'xltm', 'xltx', 'xml', 'xpi', 'xps', 'xrb', 'xspf', 'xz', 'yml', 'z', 'zip', 'zsh'
]);

// type => icon
export const getTypeIcon = type => {
  if (type === TYPE_FOLDER) {
    return 'folder';
  } else if (knownTypes.has(type)) {
    return type;
  }
  return 'blank';   // for unknown file types
};
