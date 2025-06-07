export class FileHelper {
  static fileSize(size: number): string {
    if (size <= 0) return '0 Bytes';

    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(size) / Math.log(1024));

    return parseFloat((size / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
  }
}
