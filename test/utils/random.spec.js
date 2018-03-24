/* eslint promise/catch-or-return: 0 */
/* eslint promise/always-return: 0 */
import { getRandomPort, getRandomString } from '../../app/utils/random';

describe('utils', () => {
  describe('getRandomPort', () => {
    it('should always get a free random port between 9000 and 65535', () => {
      getRandomPort().then(port => {
        expect(port).toBeGreaterThanOrEqual(9000);
        expect(port).toBeLessThanOrEqual(65535);
      });
    });
  });


  describe('getRandomString', () => {
    it('should return correct length', () => {
      for (let i = 10; i <= 100; i += 10) {
        expect(getRandomString(i).length).toBe(i);
      }
    });
  });
});
