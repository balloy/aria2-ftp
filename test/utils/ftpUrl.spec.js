
import { joinURL, buildFTPAddress, parseFTPAddress } from '../../app/utils/ftpUrl';

describe('utils', () => {
  describe('joinURL', () => {
    it('should join the 2 input strings and add / if needed', () => {
      expect(joinURL('a', 'b')).toBe('a/b');
      expect(joinURL('a/', 'b')).toBe('a/b');
      expect(joinURL('a', '/b')).toBe('a/b');
      expect(joinURL('a/', '/b')).toBe('a/b');
    });

    it('should not change other parts', () => {
      expect(joinURL('http://a.com', 'b')).toBe('http://a.com/b');
      expect(joinURL('a/', 'b/c/def')).toBe('a/b/c/def');
    });
  });


  describe('buildFTPAddress', () => {
    const buildJson = (host, user, password, port) => ({ host, user, password, port });
    it('should handle all fields properly', () => {
      expect(buildFTPAddress(buildJson('a.com', 'u', 'p', '43')))
        .toBe('ftp://u:p@a.com:43');
    });

    it('should ignore user and password if no user specified', () => {
      expect(buildFTPAddress(buildJson('a.com', '', '', '43')))
        .toBe('ftp://a.com:43');
      expect(buildFTPAddress(buildJson('a.com', '', 'p', '43')))
        .toBe('ftp://a.com:43');
    });

    it('should support pathname in host', () => {
      expect(buildFTPAddress(buildJson('a.com/path', 'u', 'p', '43')))
        .toBe('ftp://u:p@a.com:43/path');
      expect(buildFTPAddress(buildJson('a.com/p1/p2', '', 'p', '43')))
        .toBe('ftp://a.com:43/p1/p2');
    });
  });


  describe('parseFTPAddress', () => {
    it('should return NULL if wrong URL format or wrong protocal', () => {
      expect(parseFTPAddress('a')).toBeNull();
      expect(parseFTPAddress('a:b')).toBeNull();
      expect(parseFTPAddress('http://b.com')).toBeNull();
    });

    it('should parse URL with all fileds', () => {
      const url = parseFTPAddress('ftp://u:p@a.com:43/path');
      expect(url.hostname).toBe('a.com');
      expect(url.username).toBe('u');
      expect(url.password).toBe('p');
      expect(url.port).toBe('43');
      expect(url.pathname).toBe('/path');
    });

    it('should parse URL without user/password', () => {
      const url = parseFTPAddress('ftp://a.com:43/p1/p2');
      expect(url.hostname).toBe('a.com');
      expect(url.username).toBe('');
      expect(url.password).toBe('');
      expect(url.port).toBe('43');
      expect(url.pathname).toBe('/p1/p2');
    });

    it('should parse URL without port', () => {
      const url = parseFTPAddress('ftp://a.com/p1/p2');
      expect(url.hostname).toBe('a.com');
      expect(url.port).toBe('');
      expect(url.pathname).toBe('/p1/p2');
    });

    it('should parse URL without passname', () => {
      let url = parseFTPAddress('ftp://u:p@a.com:43');
      expect(url.hostname).toBe('a.com');
      expect(url.username).toBe('u');
      expect(url.password).toBe('p');
      expect(url.port).toBe('43');
      expect(url.pathname).toBe('/');

      url = parseFTPAddress('sftp://a.com:43/');
      expect(url.hostname).toBe('a.com');
      expect(url.port).toBe('43');
      expect(url.pathname).toBe('/');
    });
  });
});
