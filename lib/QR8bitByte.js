import { QRMode } from './constants';

// class QR8bitByte
/* eslint-disable no-bitwise */
export default class QR8bitByte {
  constructor(data) {
    this.mode = QRMode.EIGHT_BIT_BYTE;
    // this.data = data;
    this.init(data);
  }

  init(data) {
    this.parsedData = [];
    // Added to support UTF-8 Characters
    for (let i = 0; i < data.length; i++) {
      let byteArray = [];
      const code = data.charCodeAt(i);

      if (code > 0x10000) {
        byteArray = [
          0xF0 | ((code & 0x1C0000) >>> 18),
          0x80 | ((code & 0x3F000) >>> 12),
          0x80 | ((code & 0xFC0) >>> 6),
          0x80 | (code & 0x3F),
        ];
      } else if (code > 0x800) {
        byteArray = [
          0xE0 | ((code & 0xF000) >>> 12),
          0x80 | ((code & 0xFC0) >>> 6),
          0x80 | (code & 0x3F),
        ];
      } else if (code > 0x80) {
        byteArray = [
          0xC0 | ((code & 0x7C0) >>> 6),
          0x80 | (code & 0x3F),
        ];
      } else {
        byteArray = [code];
      }

      this.parsedData = this.parsedData.concat(...byteArray);
    }

    if (this.parsedData.length !== data.length) {
      this.parsedData.unshift(191);
      this.parsedData.unshift(187);
      this.parsedData.unshift(239);
    }
  }

  getLength() {
    return this.parsedData.length;
  }

  write(buffer) {
    this.parsedData.forEach(data => {
      buffer.put(data, 8);
    });
  }
}
