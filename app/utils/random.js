
const detect = require('detect-port');

// return a Promise
export const getRandomPort = () => {
  const random = Math.floor(9000 + (Math.random() * (65535 - 9000)));
  return detect(random);
};

export const getRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; ++i) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
