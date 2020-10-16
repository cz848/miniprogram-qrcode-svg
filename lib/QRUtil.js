import { QRMode } from './constants';
import QRMath from './QRMath';
import QRPolynomial from './QRPolynomial';

// QRUtil
/* eslint-disable no-bitwise */
const PATTERN_POSITION_TABLE = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];
const G15 = 1335;
const G18 = 7973;
const G15_MASK = 21522;

const getBCHDigit = data => {
  let digit = 0;
  let nData = data;
  while (nData !== 0) {
    digit += 1;
    nData >>>= 1;
  }
  return digit;
};

const getBCHTypeInfo = data => {
  let d = data << 10;
  while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
    d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15)));
  }
  return ((data << 10) | d) ^ G15_MASK;
};

const getBCHTypeNumber = data => {
  let d = data << 12;
  while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
    d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18)));
  }
  return (data << 12) | d;
};

const getPatternPosition = typeNumber => PATTERN_POSITION_TABLE[typeNumber - 1];

const getMask = (maskPattern, i, j) => {
  if (!/^[0-7]$/.test(maskPattern)) throw new Error(`bad maskPattern:${maskPattern}`);
  return [
    (i + j) % 2,
    i % 2,
    j % 3,
    (i + j) % 3,
    (Math.floor(i / 2) + Math.floor(j / 3)) % 2,
    ((i * j) % 2) + ((i * j) % 3),
    (((i * j) % 2) + ((i * j) % 3)) % 2,
    (((i * j) % 3) + ((i + j) % 2)) % 2,
  ][maskPattern] === 0;
};

const getErrorCorrectPolynomial = errorCorrectLength => {
  let a = new QRPolynomial([1], 0);
  for (let i = 0; i < errorCorrectLength; i++) {
    a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
  }
  return a;
};

const getLengthInBits = (mode, type) => {
  if (type < 1 || type >= 41) throw new Error(`type:${type}`);
  if (!Object.values(QRMode).includes(mode)) throw new Error(`mode:${mode}`);

  const { NUMBER, ALPHA_NUM, EIGHT_BIT_BYTE, KANJI } = QRMode;
  if (type >= 1 && type < 10) {
    return {
      [NUMBER]: 10,
      [ALPHA_NUM]: 9,
      [EIGHT_BIT_BYTE]: 8,
      [KANJI]: 8,
    }[mode];
  }
  if (type < 27) {
    return {
      [NUMBER]: 12,
      [ALPHA_NUM]: 11,
      [EIGHT_BIT_BYTE]: 16,
      [KANJI]: 10,
    }[mode];
  }
  if (type < 41) {
    return {
      [NUMBER]: 14,
      [ALPHA_NUM]: 13,
      [EIGHT_BIT_BYTE]: 16,
      [KANJI]: 12,
    }[mode];
  }
};

export default {
  getBCHTypeInfo,
  getBCHTypeNumber,
  getPatternPosition,
  getMask,
  getErrorCorrectPolynomial,
  getLengthInBits,
};
