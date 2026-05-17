import * as path from 'node:path';

export function normalizeUploadedFilename(filename: string): string {
  if (!filename) {
    return filename;
  }

  const decoded = Buffer.from(filename, 'latin1').toString('utf8');
  const originalExt = path.extname(filename).toLowerCase();
  const decodedExt = path.extname(decoded).toLowerCase();

  if (
    originalExt === decodedExt &&
    !containsCjk(filename) &&
    containsCjk(decoded)
  ) {
    return decoded;
  }

  return filename;
}

function containsCjk(value: string): boolean {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(value);
}
