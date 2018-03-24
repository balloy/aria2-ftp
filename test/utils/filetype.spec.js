
import { getFileType, getTypeIcon, TYPE_FOLDER } from '../../app/utils/filetype';

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

    it('should return "file-$type" for known file types', () => {
      expect(getTypeIcon('jpg')).toBe('file-image');
      expect(getTypeIcon('docx')).toBe('file-word');
      expect(getTypeIcon('mp4')).toBe('file-video');
    });

    it('should return "file" for unknown file types', () => {
      expect(getTypeIcon('xxx')).toBe('file');
    });
  });
});
