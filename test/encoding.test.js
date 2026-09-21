import { test } from 'node:test';
import assert from 'node:assert/strict';
import qrCodeSVG from '../index.js';

const GOLDEN = [
  {
    content: 'A',
    ecl: 'L',
    typeNumber: 1,
    rows: [
      '111111101011101111111',
      '100000100011001000001',
      '101110101101001011101',
      '101110101100101011101',
      '101110101001001011101',
      '100000100111101000001',
      '111111101010101111111',
      '000000000001100000000',
      '111100101111110011101',
      '011101011001111001000',
      '110100100101000001101',
      '010001001011001111100',
      '000011100110100100100',
      '000000001101001001001',
      '111111100011100101000',
      '100000100110000110110',
      '101110100110111110001',
      '101110101001001111110',
      '101110101010101100000',
      '100000101100010100101',
      '111111101110010010000',
    ],
  },
  {
    content: 'https://example.com',
    ecl: 'M',
    typeNumber: 2,
    rows: [
      '1111111000101010001111111',
      '1000001011100110101000001',
      '1011101011010010001011101',
      '1011101011100100101011101',
      '1011101001100100101011101',
      '1000001001010010001000001',
      '1111111010101010101111111',
      '0000000011000011100000000',
      '1000001010001000011001110',
      '0111010001010111110111110',
      '1111101011000111100101011',
      '1100110011110100101101001',
      '0001111110101101101100001',
      '1110100011100001100100010',
      '1000001100111001001111011',
      '1010100111110000011101101',
      '1010011011110000111110100',
      '0000000010001110100010000',
      '1111111000110000101010001',
      '1000001000001101100010010',
      '1011101001101011111110101',
      '1011101001100010111000011',
      '1011101001111001000001101',
      '1000001001010011110110001',
      '1111111011100110101001001',
    ],
  },
  {
    content: 'hello world',
    ecl: 'Q',
    typeNumber: 3,
    rows: [
      '11111110001111100001101111111',
      '10000010011100100001001000001',
      '10111010110010001100001011101',
      '10111010010100110100001011101',
      '10111010101010111110001011101',
      '10000010110001010101101000001',
      '11111110101010101010101111111',
      '00000000001100111000100000000',
      '01001010110100011000110110100',
      '01101000101001100111000100001',
      '10101011010100101011011110101',
      '11000001010111000001111011111',
      '01010110000111000000110001101',
      '10010000100010010010011010110',
      '01101110110101000100011011011',
      '00001000000010010111001011001',
      '00001110101100000011000111000',
      '10110100110010101001110011101',
      '00110010100000101100101001001',
      '00111100111001000110000100000',
      '11000011000111111011111110101',
      '00000000100101100100100010000',
      '11111110000010010011101010000',
      '10000010000100111001100011010',
      '10111010101111001001111111011',
      '10111010000010000110010000000',
      '10111010010101010011110000111',
      '10000010111100011000000101111',
      '11111110001000100000001101110',
    ],
  },
];

const matrixRows = qr => qr.qrcode.modules.map(column => column.map(cell => (cell ? '1' : '0')).join(''));

const transpose = rows => rows[0].split('').map((_, index) => rows.map(row => row[index]).join(''));

const renderedGrid = golden => {
  const size = 256;
  const moduleCount = golden.rows.length;
  const step = size / moduleCount;
  const svg = qrCodeSVG(golden.content, {
    ecl: golden.ecl,
    typeNumber: golden.typeNumber,
    width: size,
    height: size,
    color: '#000000',
    background: '#ffffff',
    join: false,
  }).toSVG();
  const cells = svg.match(/<rect x="[-\d.]+" y="[-\d.]+" width="[-\d.]+" height="[-\d.]+" fill="#000000"/g)
    || [];
  assert.equal(cells.length, golden.rows.join('').split('1').length - 1, '模块矩形数量应与暗模块数一致');
  const grid = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill('0'));
  cells.forEach(cell => {
    const [x, y] = cell.match(/[\d.]+/g).map(Number);
    grid[Math.round(y / step)][Math.round(x / step)] = '1';
  });
  return grid.map(row => row.join(''));
};

const FINDER = [
  '1111111',
  '1000001',
  '1011101',
  '1011101',
  '1011101',
  '1000001',
  '1111111',
];

const hasFinderAt = (rows, top, left) => FINDER
  .every((line, offset) => rows[top + offset].slice(left, left + 7) === line);

test('编码矩阵与独立参考实现一致', async t => {
  await t.test('三个版本的模块矩阵逐格一致', () => {
    GOLDEN.forEach(golden => {
      const qr = qrCodeSVG(golden.content, { ecl: golden.ecl, typeNumber: golden.typeNumber });
      assert.deepEqual(matrixRows(qr), golden.rows, `${golden.content} / ecl ${golden.ecl}`);
    });
  });

  await t.test('矩阵维度为 21 + 4 × (版本 - 1)', () => {
    GOLDEN.forEach(golden => {
      const qr = qrCodeSVG(golden.content, { ecl: golden.ecl, typeNumber: golden.typeNumber });
      assert.equal(qr.qrcode.modules.length, 21 + 4 * (golden.typeNumber - 1));
    });
  });
});

test('渲染栅格', async t => {
  await t.test('渲染栅格是编码矩阵的转置', () => {
    const golden = GOLDEN[1];
    const qr = qrCodeSVG(golden.content, { ecl: golden.ecl, typeNumber: golden.typeNumber });
    assert.deepEqual(renderedGrid(golden), transpose(matrixRows(qr)));
  });

  await t.test('三个角都带定位图形', () => {
    const golden = GOLDEN[1];
    const rows = renderedGrid(golden);
    const count = golden.rows.length;
    assert.ok(hasFinderAt(rows, 0, 0), '左上角应有定位图形');
    assert.ok(hasFinderAt(rows, 0, count - 7), '右上角应有定位图形');
    assert.ok(hasFinderAt(rows, count - 7, 0), '左下角应有定位图形');
  });

  await t.test('第 6 行与第 6 列为交替的时序图形', () => {
    const golden = GOLDEN[0];
    const rows = matrixRows(qrCodeSVG(golden.content, { ecl: golden.ecl, typeNumber: golden.typeNumber }));
    const count = rows.length;
    for (let index = 8; index <= count - 9; index += 1) {
      const expected = index % 2 === 0 ? '1' : '0';
      assert.equal(rows[6][index], expected, `第 6 行第 ${index} 列`);
      assert.equal(rows[index][6], expected, `第 ${index} 行第 6 列`);
    }
  });
});

test('多字节内容', async t => {
  await t.test('含多字节字符的内容可正常产出且结构有效', () => {
    ['é', 'Привет', '你好', '混合 mixed 内容', '🚀'].forEach(content => {
      const rows = matrixRows(qrCodeSVG(content, { ecl: 'M' }));
      const count = rows.length;
      assert.equal(count % 4, 1, `${content} 的格数应为 21 + 4n`);
      assert.ok(count >= 21, `${content} 的格数不应小于 21`);
      assert.ok(hasFinderAt(rows, 0, 0), `${content} 应有左上角定位图形`);
      assert.ok(hasFinderAt(rows, count - 7, 0), `${content} 应有左下角定位图形`);
    });
  });

  await t.test('二字节与三字节字符按 UTF-8 编码', () => {
    assert.deepEqual(qrCodeSVG('é').qrcode.dataList[0].parsedData, [0xef, 0xbb, 0xbf, 0xc3, 0xa9]);
    assert.deepEqual(qrCodeSVG('你').qrcode.dataList[0].parsedData, [0xef, 0xbb, 0xbf, 0xe4, 0xbd, 0xa0]);
  });

  await t.test('纯 ASCII 内容不插入额外字节', () => {
    const bytes = qrCodeSVG('abc').qrcode.dataList[0].parsedData;
    assert.deepEqual(bytes, [0x61, 0x62, 0x63]);
  });
});
