import { TextDecoder } from 'node:util';

export type SupportedTextEncoding =
  | 'utf-8'
  | 'utf-16le'
  | 'utf-16be'
  | 'gb18030';

export interface DecodedTextResult {
  text: string;
  encoding: SupportedTextEncoding;
}

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const UTF16LE_BOM = Buffer.from([0xff, 0xfe]);
const UTF16BE_BOM = Buffer.from([0xfe, 0xff]);

export function decodeKnowledgeTextBuffer(buffer: Buffer): DecodedTextResult {
  if (buffer.length === 0) {
    return {
      text: '',
      encoding: 'utf-8',
    };
  }

  const bomEncoding = detectBomEncoding(buffer);
  if (bomEncoding) {
    return {
      text: decodeWithEncoding(
        buffer.subarray(getBomLength(bomEncoding)),
        bomEncoding,
      ),
      encoding: bomEncoding,
    };
  }

  const utf16Encoding = detectUtf16WithoutBom(buffer);
  if (utf16Encoding) {
    return {
      text: decodeWithEncoding(buffer, utf16Encoding),
      encoding: utf16Encoding,
    };
  }

  if (isValidUtf8(buffer)) {
    return {
      text: decodeWithEncoding(buffer, 'utf-8'),
      encoding: 'utf-8',
    };
  }

  return {
    text: decodeWithEncoding(buffer, 'gb18030'),
    encoding: 'gb18030',
  };
}

function detectBomEncoding(buffer: Buffer): SupportedTextEncoding | null {
  if (buffer.subarray(0, UTF8_BOM.length).equals(UTF8_BOM)) {
    return 'utf-8';
  }

  if (buffer.subarray(0, UTF16LE_BOM.length).equals(UTF16LE_BOM)) {
    return 'utf-16le';
  }

  if (buffer.subarray(0, UTF16BE_BOM.length).equals(UTF16BE_BOM)) {
    return 'utf-16be';
  }

  return null;
}

function getBomLength(encoding: SupportedTextEncoding): number {
  switch (encoding) {
    case 'utf-8':
      return UTF8_BOM.length;
    case 'utf-16le':
    case 'utf-16be':
      return UTF16LE_BOM.length;
    case 'gb18030':
      return 0;
  }
}

function detectUtf16WithoutBom(
  buffer: Buffer,
): Extract<SupportedTextEncoding, 'utf-16le' | 'utf-16be'> | null {
  const sample = buffer.subarray(0, Math.min(buffer.length, 2048));
  const pairCount = Math.floor(sample.length / 2);

  if (pairCount < 8) {
    return null;
  }

  let evenZeroBytes = 0;
  let oddZeroBytes = 0;

  for (let index = 0; index < pairCount * 2; index += 2) {
    if (sample[index] === 0) {
      evenZeroBytes += 1;
    }

    if (sample[index + 1] === 0) {
      oddZeroBytes += 1;
    }
  }

  const evenZeroRatio = evenZeroBytes / pairCount;
  const oddZeroRatio = oddZeroBytes / pairCount;

  if (oddZeroRatio > 0.3 && evenZeroRatio < 0.1) {
    return 'utf-16le';
  }

  if (evenZeroRatio > 0.3 && oddZeroRatio < 0.1) {
    return 'utf-16be';
  }

  return null;
}

function isValidUtf8(buffer: Buffer): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

function decodeWithEncoding(
  buffer: Buffer,
  encoding: SupportedTextEncoding,
): string {
  return new TextDecoder(encoding).decode(buffer).replace(/\u0000/g, '');
}
