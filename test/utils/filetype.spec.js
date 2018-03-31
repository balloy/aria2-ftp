
import { getFileType, getTypeIcon, TYPE_FOLDER } from '../../app/utils/fileType';

const fs = require('fs');
const path = require('path');

describe('utils', () => {
  describe('getFileType', () => {
    it('should return extension as type', () => {
      expect(getFileType('1.txt')).toBe('txt');
      expect(getFileType('2.jpeg')).toBe('jpeg');
      expect(getFileType('3.longextension')).toBe('longextension');
    });

    it('should be able to handle full file path', () => {
      expect(getFileType('c:\\a\\b\\c1.txt')).toBe('txt');
      expect(getFileType('../a/b/2.mp3')).toBe('mp3');
    });

    it('should return file name when no extension', () => {
      expect(getFileType('1txt')).toBe('1txt');
      expect(getFileType('c:\\a\\b\\2mp3')).toBe('2mp3');
      expect(getFileType('c:\\a\\b\\c1.txt\\def')).toBe('def');
    });
  });

  describe('getTypeIcon', () => {
    it('should return "folder" for folder', () => {
      expect(getTypeIcon(TYPE_FOLDER)).toBe('folder');
    });

    it('should return type for known file types', () => {
      expect(getTypeIcon('jpg')).toBe('jpg');
      expect(getTypeIcon('docx')).toBe('docx');
      expect(getTypeIcon('mp4')).toBe('mp4');
    });

    it('should all .svg been included in known file types', () => {
      // current working dir should be project root dir
      const files = fs.readdirSync('./app/assets/icons/classic');
      let count = 0;
      files.forEach(f => {
        if (getFileType(f) === 'svg') {
          count += 1;
          const typeName = path.basename(f, '.svg');
          expect(getTypeIcon(typeName)).toBe(typeName);
        }
      });
      // there should be at least 200 known types.
      expect(count).toBeGreaterThanOrEqual(200);
    });

    it('should return "blank" for unknown file types', () => {
      expect(getTypeIcon('xxx')).toBe('blank');
    });
  });
});
