import { test } from 'node:test';
import assert from 'node:assert/strict';
import qrCodeSVG from '../index.js';

const COLOR = '#000000';
const BACKGROUND = '#ffffff';

const onGrid = (value, step) => Math.abs(value / step - Math.round(value / step)) * step < 0.006;

const moduleRects = svg => {
  const found = [];
  const re = new RegExp(`<rect x="([-\\d.]+)" y="([-\\d.]+)" width="([-\\d.]+)" height="([-\\d.]+)" fill="${
    COLOR}"`, 'g');
  let hit = re.exec(svg);
  while (hit) {
    found.push({ x: Number(hit[1]), y: Number(hit[2]), w: Number(hit[3]), h: Number(hit[4]) });
    hit = re.exec(svg);
  }
  return found;
};

const shapeUses = svg => {
  const found = [];
  const re = /<use x="([-\d.]+)" y="([-\d.]+)" href="#qrmodule"\/>/g;
  let hit = re.exec(svg);
  while (hit) {
    found.push({ x: Number(hit[1]), y: Number(hit[2]) });
    hit = re.exec(svg);
  }
  return found;
};

const build = (content, options) => qrCodeSVG(content, {
  color: COLOR, background: BACKGROUND, join: false, ...options,
}).toSVG();

test('容器', async t => {
  await t.test('默认输出完整 svg 文档并带 width/height', () => {
    const svg = build('A');
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" version="1\.1" width="256" height="256">/);
    assert.match(svg, /<\/svg>$/);
  });

  await t.test('viewbox 容器改写为 viewBox 且不带 width/height 属性', () => {
    const svg = build('A', { container: 'viewbox' });
    assert.match(svg, /viewBox="0 0 256 256"/);
    assert.doesNotMatch(svg, /<svg[^>]*width=/);
    assert.doesNotMatch(svg, /<svg[^>]*height=/);
  });

  await t.test('g 容器只输出分组元素', () => {
    const svg = build('A', { container: 'g' });
    assert.match(svg, /^<g width="256" height="256">/);
    assert.match(svg, /<\/g>$/);
    assert.doesNotMatch(svg, /<svg/);
  });

  await t.test('未知容器值退化为不包裹容器', () => {
    ['none', 'bogus'].forEach(container => {
      const svg = build('A', { container });
      assert.doesNotMatch(svg, /<svg/);
      assert.doesNotMatch(svg, /<g /);
      assert.match(svg, /^<rect/);
    });
  });
});

test('模块渲染', async t => {
  await t.test('join 为真时模块合并为单个 path', () => {
    const svg = build('A', { join: true });
    assert.equal((svg.match(/<path/g) || []).length, 1);
    assert.equal(moduleRects(svg).length, 0);
  });

  await t.test('join 为假时每个模块一个 rect 且坐标落在网格上', () => {
    const svg = build('A', { join: false });
    const rects = moduleRects(svg);
    const step = 256 / 21;
    assert.ok(rects.length > 0, '应产出模块矩形');
    rects.forEach(rect => {
      assert.ok(onGrid(rect.x, step), `x 应为步长整数倍: ${rect.x}`);
      assert.ok(onGrid(rect.y, step), `y 应为步长整数倍: ${rect.y}`);
      assert.ok(rect.x >= 0 && rect.x < 256 && rect.y >= 0 && rect.y < 256, '坐标应落在画布内');
    });
  });

  await t.test('pretty 为真时输出换行与缩进', () => {
    assert.match(build('A', { pretty: true }), /\r\n/);
    assert.doesNotMatch(build('A', { pretty: false }), /\r\n/);
  });

  await t.test('xmlDeclaration 为真时前置 XML 声明', () => {
    assert.match(build('A', { xmlDeclaration: true }), /^<\?xml version="1\.0" standalone="yes"\?>/);
    assert.doesNotMatch(build('A', { xmlDeclaration: false }), /^<\?xml/);
  });

  await t.test('颜色与背景色写入输出', () => {
    const svg = qrCodeSVG('A', { color: '#ff0000', background: '#00ff00', join: false }).toSVG();
    assert.match(svg, /fill="#ff0000"/);
    assert.match(svg, /fill="#00ff00"/);
  });
});

test('几何换算', async t => {
  await t.test('padding 把模块整体内缩且不改变模块尺寸', () => {
    const plain = moduleRects(build('A', { padding: 0 }));
    const padded = moduleRects(build('A', { padding: 4 }));
    const plainStep = 256 / 21;
    const paddedStep = 256 / (21 + 8);

    assert.equal(Math.min(...plain.map(r => r.x)), 0);
    assert.ok(Math.min(...padded.map(r => r.x)) > 0, 'padding 后应留出静默区');
    assert.ok(Math.abs(plain[0].w - plainStep) < 1e-6, '未设 padding 时模块宽为画布宽/格数');
    assert.ok(padded.every(r => Math.abs(r.w - paddedStep) < 1e-6), 'padding 后模块尺寸应随之缩小');
  });

  await t.test('width 与 height 不同时按各自步长换算', () => {
    const svg = build('A', { width: 100, height: 200 });
    const rects = moduleRects(svg);
    const first = rects.find(r => r.x === 0 && r.y === 0);
    assert.ok(first, '应存在左上角模块');
    assert.ok(Math.abs(first.w - 100 / 21) < 1e-2, `模块宽应取自 width，实际 ${first.w}`);
    assert.ok(Math.abs(first.h - 200 / 21) < 1e-2, `模块高应取自 height，实际 ${first.h}`);
  });

  await t.test('swap 为真时模块坐标整体互换', () => {
    const plain = moduleRects(build('A', { width: 256, height: 256 }))
      .map(rect => `${rect.x}:${rect.y}`).sort();
    const swapped = moduleRects(build('A', { width: 256, height: 256, swap: true }))
      .map(rect => `${rect.y}:${rect.x}`).sort();
    assert.deepEqual(swapped, plain);
  });

  await t.test('predefined 的预定义形状横纵尺寸与网格步长一致', () => {
    const svg = qrCodeSVG('A', {
      width: 100, height: 200, predefined: true, join: false,
    }).toSVG();
    const defs = svg.match(/<path id="qrmodule" d="M0 0 h([\d.]+) v([\d.]+) H0 z"/);
    assert.ok(defs, '应输出预定义形状');
    assert.equal(Number(defs[1]), 100 / 21, 'h 应等于横向步长');
    assert.equal(Number(defs[2]), 200 / 21, 'v 应等于纵向步长');
  });

  await t.test('predefined 下每个模块引用一次预定义形状且落在网格上', () => {
    const svg = qrCodeSVG('A', {
      width: 100, height: 200, predefined: true, join: false,
    }).toSVG();
    const uses = shapeUses(svg);
    const xStep = 100 / 21;
    const yStep = 200 / 21;
    assert.ok(uses.length > 0, '应产出模块引用');
    uses.forEach(use => {
      assert.ok(onGrid(use.x, xStep), `x 应为横向步长整数倍: ${use.x}`);
      assert.ok(onGrid(use.y, yStep), `y 应为纵向步长整数倍: ${use.y}`);
    });
  });
});

test('toDataURL', async t => {
  await t.test('输出 svg dataURL 且可无损还原', () => {
    const url = qrCodeSVG('A', { color: COLOR }).toDataURL();
    assert.match(url, /^data:image\/svg\+xml;utf8,/);
    assert.equal(decodeURIComponent(url.replace(/^data:image\/svg\+xml;utf8,/, '')), qrCodeSVG('A', { color: COLOR }).toSVG());
  });

  await t.test('内容中的 # 被转义，不会截断 dataURI', () => {
    const url = qrCodeSVG('A').toDataURL();
    assert.ok(url.indexOf('#') === -1, 'dataURI 中不应出现裸 #');
  });
});
