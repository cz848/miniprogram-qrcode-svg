import { test } from 'node:test';
import assert from 'node:assert/strict';
import QRRSBlock from '../lib/QRRSBlock.js';
import { QRErrorCorrectLevel } from '../lib/constants.js';
import qrCodeSVG from '../index.js';

const LEVELS = ['L', 'M', 'Q', 'H'];
const sumOf = (blocks, field) => blocks.reduce((sum, block) => sum + block[field], 0);

test('分块表不变式', async t => {
  await t.test('同一版本的四个纠错等级总码字数必须相等', () => {
    const mismatched = [];
    for (let version = 1; version <= 40; version += 1) {
      const totals = LEVELS.map(ecl => sumOf(
        QRRSBlock.getRSBlocks(version, QRErrorCorrectLevel[ecl]),
        'totalCount',
      ));
      if (new Set(totals).size !== 1) mismatched.push(`v${version} -> ${totals.join('/')}`);
    }
    assert.deepEqual(mismatched, [], '各版本总码字数应一致');
  });

  await t.test('总码字数随版本严格递增', () => {
    let previous = 0;
    for (let version = 1; version <= 40; version += 1) {
      const total = sumOf(QRRSBlock.getRSBlocks(version, QRErrorCorrectLevel.L), 'totalCount');
      assert.ok(total > previous, `v${version} 的总码字数应大于 v${version - 1}`);
      previous = total;
    }
  });

  await t.test('总码字数与规范取值一致（抽样）', () => {
    const expected = {
      1: 26, 10: 346, 14: 581, 15: 655, 16: 733, 40: 3706,
    };
    Object.keys(expected).forEach(version => {
      const total = sumOf(QRRSBlock.getRSBlocks(Number(version), QRErrorCorrectLevel.L), 'totalCount');
      assert.equal(total, expected[version], `v${version}`);
    });
  });

  await t.test('每个版本的数据码字数不超过总码字数', () => {
    for (let version = 1; version <= 40; version += 1) {
      LEVELS.forEach(ecl => {
        const blocks = QRRSBlock.getRSBlocks(version, QRErrorCorrectLevel[ecl]);
        const total = sumOf(blocks, 'totalCount');
        const data = sumOf(blocks, 'dataCount');
        assert.ok(data > 0 && data < total, `v${version} ${ecl} 的数据码字数应为正且小于总码字数`);
      });
    }
  });
});

test('v15 的 H 等级分块', async t => {
  await t.test('块数、总码字数与数据码字数与规范一致', () => {
    const blocks = QRRSBlock.getRSBlocks(15, QRErrorCorrectLevel.H);
    assert.equal(blocks.length, 18, '块数');
    assert.equal(sumOf(blocks, 'totalCount'), 655, '总码字数');
    assert.equal(sumOf(blocks, 'dataCount'), 223, '数据码字数');
  });
});

test('ecl 为 H 时的容量回归', async t => {
  await t.test('此前会溢出的长度区间现可正常产出并落在预期版本', () => {
    const cases = [[191, 73], [192, 77], [200, 77], [217, 77], [218, 81]];
    cases.forEach(([length, modules]) => {
      const qr = qrCodeSVG('a'.repeat(length), { ecl: 'H' });
      assert.equal(qr.qrcode.modules.length, modules, `内容长度 ${length} 应产出 ${modules} 格`);
    });
  });
});
