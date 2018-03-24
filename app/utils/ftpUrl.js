/* eslint no-param-reassign: 0 */
const { URL } = require('url');

// unlike path.join(), will note remove // in result
export const joinURL = (p1, p2) => {
  if (p1[p1.length - 1] === '/') p1 = p1.slice(0, p1.length - 1);
  if (p2[0] === '/') p2 = p2.slice(1);
  return (`${p1}/${p2}`);
};

// construct FTP address from inputs
// support adding pathname in host directly.
export const buildFTPAddress = ({ host, user, password, port }) => {
  // check if pathname exists
  let pathname = '';
  const p = host.indexOf('/');
  if (p > 0) {
    pathname = host.substr(p);
    host = host.substr(0, p);
  }

  // if no username specified, ignore password as well.
  const auth = (user.length) ? `${user}:${password}@` : '';

  // build the result;
  return `ftp://${auth}${host}:${port}${pathname}`;
};

// return a URL object if valid, otherwise return null
export const parseFTPAddress = (address) => {
  let url;
  try {
    url = new URL(address);
  } catch (e) {
    return null; // invalid URL format
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== 'ftp:' && protocol !== 'sftp:') {
    return null; // wrong protocol
  }

  return url;
};
