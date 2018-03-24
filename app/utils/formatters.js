
export const formatSize = (size, sizeFormat) => {
  if (undefined === size) {
    return '';
  } else if (sizeFormat === 'bytes') {
    return `${size.toLocaleString()} B`;
  }
  return readableSize(size);
};

const readableSize = (bytes) => {
  if (bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  if (i === 0) return `${bytes} ${sizes[i]}`;
  return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
};

export const formatDateTime = date => (
  date ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` : ''
);

export const formatSpeed = (speed, sizeFormat) => (
  speed ? `${formatSize(Math.round(speed), sizeFormat)}/s` : ''
);

export const formatETA = eta => {
  let s = Math.floor(eta);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  s = Math.floor(s % 3600 % 60);

  const hDisplay = (h > 0) ? `${h}h` : '';
  const mDisplay = (m > 0) ? `${m}m` : '';
  const sDisplay = (s > 0) ? `${s}s` : '';
  return hDisplay + mDisplay + sDisplay;
};
