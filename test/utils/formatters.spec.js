
import { formatSize, formatDateTime, formatSpeed, formatETA } from '../../app/utils/formatters';

describe('utils', () => {
  describe('formatSize', () => {
    it('should handle 0/undefined properly', () => {
      expect(formatSize(undefined)).toBe('');
      expect(formatSize(0)).toBe('0 B');
    });

    it('should return bytes with format bytes', () => {
      expect(formatSize(7, 'bytes')).toBe('7 B');
      expect(formatSize(7000, 'bytes')).toBe('7,000 B');
      expect(formatSize(1234567890, 'bytes')).toBe('1,234,567,890 B');
    });

    it('should return B/KB/MB/GB/... respectively with format human', () => {
      expect(formatSize(7, 'human')).toBe('7 B');
      expect(formatSize(1023, 'human')).toBe('1023 B');
      expect(formatSize(7000, 'human')).toBe('6.8 KB');
      expect(formatSize(3.54 * (1024 ** 2), 'human')).toBe('3.5 MB');
      expect(formatSize(Math.ceil(3.55 * (1024 ** 2)), 'human')).toBe('3.6 MB');
      expect(formatSize(2.1 * (1024 ** 3), 'human')).toBe('2.1 GB');
      expect(formatSize(1023.9 * (1024 ** 4), 'human')).toBe('1023.9 TB');
    });

    it('should use human format by default', () => {
      expect(formatSize(10240)).toBe('10.0 KB');
      expect(formatSize(10240, '')).toBe('10.0 KB');
      expect(formatSize(10240, 'any')).toBe('10.0 KB');
    });
  });


  describe('formatDateTime', () => {
    it('should handle undefined properly', () => {
      expect(formatDateTime(undefined)).toBe('');
    });

    it('should include date/hour/minute', () => {
      const now = new Date();
      expect(formatDateTime(now)).toMatch(now.getDate().toString());
      expect(formatDateTime(now)).toMatch(now.getHours().toString());
      expect(formatDateTime(now)).toMatch(now.getMinutes().toString());
    });
  });


  describe('formatSpeed', () => {
    it('should handle undefined properly', () => {
      expect(formatSpeed(undefined)).toBe('');
    });

    it('should return results similar with formatSize', () => {
      expect(formatSpeed(123456, 'bytes')).toBe(`${formatSize(123456, 'bytes')}/s`);
      expect(formatSpeed(123456, 'human')).toBe(`${formatSize(123456, 'human')}/s`);
    });

    it('should round the number first', () => {
      expect(formatSpeed(6.4, 'human')).toBe(`${formatSize(6, 'human')}/s`);
      expect(formatSpeed(6.9, 'human')).toBe(`${formatSize(7, 'human')}/s`);
    });
  });


  describe('formatETA', () => {
    it('should return results like h:m:s', () => {
      expect(formatETA(5)).toBe('5s');
      expect(formatETA(150)).toBe('2m30s');
      expect(formatETA(180)).toBe('3m');
      expect(formatETA(3600 + 307)).toBe('1h5m7s');
    });

    it('should skip useless units automatically', () => {
      expect(formatETA(180)).toBe('3m');
      expect(formatETA(7200)).toBe('2h');
      expect(formatETA(3600 * 33)).toBe('33h');
      expect(formatETA(3600 + 30)).toBe('1h30s');
    });
  });
});
