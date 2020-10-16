import { createArray } from './utils';
import QR8bitByte from './QR8bitByte';
import QRBitBuffer from './QRBitBuffer';
import QRPolynomial from './QRPolynomial';
import QRRSBlock from './QRRSBlock';
import QRUtil from './QRUtil';

// class QRCodeModel
/* eslint-disable no-bitwise,no-constant-condition */
const PAD0 = 0xEC;
const PAD1 = 0x11;
const createBytes = (buffer, rsBlocks) => {
  let offset = 0;
  let maxDcCount = 0;
  let maxEcCount = 0;
  const dcdata = new Array(rsBlocks.length);
  const ecdata = new Array(rsBlocks.length);
  let totalCodeCount = 0;
  rsBlocks.forEach((block, r) => {
    const dcCount = block.dataCount;
    const ecCount = block.totalCount - dcCount;
    maxDcCount = Math.max(maxDcCount, dcCount);
    maxEcCount = Math.max(maxEcCount, ecCount);
    dcdata[r] = createArray(dcCount, (_, i) => 0xff & buffer.buffer[i + offset]);
    offset += dcCount;
    const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
    const rsPolyLength = rsPoly.getLength();
    const rawPoly = new QRPolynomial(dcdata[r], rsPolyLength - 1);
    const modPoly = rawPoly.mod(rsPoly);
    ecdata[r] = createArray(rsPolyLength - 1, (_, i) => {
      const modIndex = i + modPoly.getLength() - (rsPolyLength - 1);
      return modIndex >= 0 ? modPoly.get(modIndex) : 0;
    });

    totalCodeCount += block.totalCount;
  });
  const data = new Array(totalCodeCount);
  let index = 0;
  const setMaxCount = (count, which) => {
    for (let i = 0; i < count; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < which[r].length) {
          data[index] = which[r][i];
          index += 1;
        }
      }
    }
  };
  setMaxCount(maxDcCount, dcdata);
  setMaxCount(maxEcCount, ecdata);
  return data;
};
const createData = (typeNumber, errorCorrectLevel, dataList) => {
  const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
  const buffer = new QRBitBuffer();
  dataList.forEach(data => {
    buffer.put(data.mode, 4);
    buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
    data.write(buffer);
  });
  let totalDataCount = rsBlocks.reduce((acc, block) => acc + block.dataCount, 0);
  totalDataCount *= 8;
  if (buffer.getLengthInBits() > totalDataCount) {
    throw new Error(`code length overflow. (${buffer.getLengthInBits()}>${totalDataCount})`);
  }
  if (buffer.getLengthInBits() + 4 <= totalDataCount) {
    buffer.put(0, 4);
  }
  while (buffer.getLengthInBits() % 8 !== 0) {
    buffer.putBit(false);
  }
  while (true) {
    if (buffer.getLengthInBits() >= totalDataCount) break;
    buffer.put(PAD0, 8);
    if (buffer.getLengthInBits() >= totalDataCount) break;
    buffer.put(PAD1, 8);
  }
  return createBytes(buffer, rsBlocks);
};

export default class QRCodeModel {
  constructor(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];
  }

  addData(data) {
    const newData = new QR8bitByte(data);
    this.dataList.push(newData);
    this.dataCache = null;
  }

  getLostPoint() {
    const { moduleCount, modules } = this;
    let lostPoint = 0;
    let darkCount = 0;
    modules.forEach((m, row) => {
      m.forEach((n, col) => {
        let sameCount = 0;
        const isDark = n;
        for (let r = -1; r < 2; r++) {
          if (row + r >= 0 && moduleCount > row + r) {
            for (let c = -1; c < 2; c++) {
              if (
                col + c >= 0
                && moduleCount > col + c
                && (r !== 0 || c !== 0)
                && isDark === modules[row + r][col + c]
              ) {
                sameCount += 1;
              }
            }
          }
        }
        if (sameCount > 5) {
          lostPoint += 3 + sameCount - 5;
        }

        if (row < moduleCount - 1 && col < moduleCount - 1) {
          let count = 0;
          if (isDark) count += 1;
          if (modules[row + 1][col]) count += 1;
          if (modules[row][col + 1]) count += 1;
          if (modules[row + 1][col + 1]) count += 1;
          if (count === 0 || count === 4) {
            lostPoint += 3;
          }
        }

        if (col < moduleCount - 6) {
          if (isDark
            && !modules[row][col + 1]
            && modules[row][col + 2]
            && modules[row][col + 3]
            && modules[row][col + 4]
            && !modules[row][col + 5]
            && modules[row][col + 6]) {
            lostPoint += 40;
          }
        }

        if (row < moduleCount - 6) {
          if (modules[col][row]
            && !modules[col][row + 1]
            && modules[col][row + 2]
            && modules[col][row + 3]
            && modules[col][row + 4]
            && !modules[col][row + 5]
            && modules[col][row + 6]) {
            lostPoint += 40;
          }
        }

        if (isDark) {
          darkCount += 1;
        }
      });
    });
    const ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5;
    lostPoint += ratio * 10;
    return lostPoint;
  }

  setupPositionProbePattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      if (row + r > -1 && this.moduleCount > row + r) {
        for (let c = -1; c <= 7; c++) {
          if (col + c > -1 && this.moduleCount > col + c) {
            const dark = (r >= 0 && r <= 6 && (c === 0 || c === 6))
              || (c >= 0 && c <= 6 && (r === 0 || r === 6))
              || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
            this.modules[row + r][col + c] = dark;
          }
        }
      }
    }
  }

  setupTimingPattern() {
    for (let i = 8; i < this.moduleCount - 8; i++) {
      if (this.modules[i][6] === null) this.modules[i][6] = i % 2 === 0;
      if (this.modules[6][i] === null) this.modules[6][i] = i % 2 === 0;
    }
  }

  setupPositionAdjustPattern() {
    const pos = QRUtil.getPatternPosition(this.typeNumber);
    pos.forEach(row => {
      pos.forEach(col => {
        if (this.modules[row][col] !== null) return;
        for (let r = -2; r < 3; r++) {
          for (let c = -2; c < 3; c++) {
            this.modules[row + r][col + c] = r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0);
          }
        }
      });
    });
  }

  setupTypeNumber(test) {
    const bits = QRUtil.getBCHTypeNumber(this.typeNumber);
    for (let i = 0; i < 18; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      const row = Math.floor(i / 3);
      const col = (i % 3) + this.moduleCount - 8 - 3;
      this.modules[row][col] = mod;
      this.modules[col][row] = mod;
    }
  }

  setupTypeInfo(test, maskPattern) {
    const data = (this.errorCorrectLevel << 3) | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) {
        this.modules[i][8] = mod;
      } else if (i < 8) {
        this.modules[i + 1][8] = mod;
      } else {
        this.modules[this.moduleCount - 15 + i][8] = mod;
      }

      if (i < 8) {
        this.modules[8][this.moduleCount - i - 1] = mod;
      } else if (i < 9) {
        this.modules[8][15 - i - 1 + 1] = mod;
      } else {
        this.modules[8][15 - i - 1] = mod;
      }
    }
    this.modules[this.moduleCount - 8][8] = !test;
  }

  mapData(data, maskPattern) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;
    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col -= 1;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            let isDark = false;
            if (byteIndex < data.length) {
              isDark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            const mask = QRUtil.getMask(maskPattern, row, col - c);
            if (mask) {
              isDark = !isDark;
            }
            this.modules[row][col - c] = isDark;
            bitIndex -= 1;
            if (bitIndex === -1) {
              byteIndex += 1;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  makeImpl(test, maskPattern) {
    const moduleCount = this.typeNumber * 4 + 17;
    this.moduleCount = moduleCount;
    this.modules = createArray(moduleCount).map(() => createArray(moduleCount, null));
    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(moduleCount - 7, 0);
    this.setupPositionProbePattern(0, moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);
    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test);
    }
    if (this.dataCache === null) {
      this.dataCache = createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
    }
    this.mapData(this.dataCache, maskPattern);
  }

  getBestMaskPattern() {
    let minLostPoint = 0;
    let pattern = 0;
    for (let i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      const lostPoint = this.getLostPoint();
      if (i === 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  }

  make() {
    this.makeImpl(false, this.getBestMaskPattern());
  }
}
