import { test } from 'node:test';
import assert from 'node:assert/strict';
import qrCodeSVG from '../index.js';

const SIZE_ERROR = /Expected 'width' or 'height' value to be higher than zero!/;

test('入参校验', async t => {
  await t.test('内容非字符串时抛错', () => {
    assert.throws(() => qrCodeSVG(123), /Expected 'content' as string!/);
  });

  await t.test('内容为空串时抛错', () => {
    assert.throws(() => qrCodeSVG(''), /Expected 'content' to be non-empty!/);
  });

  await t.test('padding 为负数时抛错', () => {
    assert.throws(() => qrCodeSVG('hi', { padding: -1 }), /Expected 'padding' value to be non-negative!/);
  });

  await t.test('width / height 非正数、非数字时抛错', () => {
    const invalid = [-5, -0.5, 0, NaN, 'abc', ''];
    invalid.forEach(value => {
      assert.throws(() => qrCodeSVG('hi', { width: value }), SIZE_ERROR, `width=${String(value)}`);
      assert.throws(() => qrCodeSVG('hi', { height: value }), SIZE_ERROR, `height=${String(value)}`);
    });
  });

  await t.test('width / height 为正数时正常产出', () => {
    const svg = qrCodeSVG('hi', { width: 512, height: 256 }).toSVG();
    assert.match(svg, /width="512" height="256"/);
  });

  await t.test('ecl 非法时抛错', () => {
    ['X', 'l', '', 0].forEach(ecl => {
      assert.throws(() => qrCodeSVG('hi', { ecl }), /error correction level/, `ecl=${String(ecl)}`);
    });
  });

  await t.test('typeNumber 取 1 与 40 时均可产出', () => {
    [1, 40].forEach(typeNumber => {
      assert.match(qrCodeSVG('hi', { typeNumber }).toSVG(), /^<svg/);
    });
  });

  await t.test('内容超出最大容量时抛错', () => {
    assert.throws(() => qrCodeSVG('a'.repeat(3000), { ecl: 'H' }), /Content too long/);
  });

  await t.test('强制指定的 typeNumber 装不下内容时抛错', () => {
    assert.throws(() => qrCodeSVG('a'.repeat(50), { typeNumber: 1 }), /code length overflow/);
  });

  await t.test('未指定 ecl 时默认采用 M', () => {
    assert.equal(qrCodeSVG('hi').toSVG(), qrCodeSVG('hi', { ecl: 'M' }).toSVG());
  });
});
