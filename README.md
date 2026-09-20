# miniprogram-qrcode-svg

纯 JavaScript 二维码生成器，输出 SVG 字符串或 SVG dataURL。适用于现代浏览器与微信小程序，不依赖 DOM、Canvas 与原生绘图接口。

## 安装

```bash
npm install miniprogram-qrcode-svg
```

## 快速开始

```javascript
import qrCodeSVG from 'miniprogram-qrcode-svg';

const svg = qrCodeSVG('https://example.com', {
  padding: 4,
  width: 256,
  height: 256,
  color: '#000000',
  background: '#ffffff',
  ecl: 'M',
}).toSVG();
```

在微信小程序中，SVG 无法直接渲染为图片，可转为 dataURL 后交由渲染层处理：

```javascript
const dataURL = qrCodeSVG('https://example.com').toDataURL();
```

## API

### qrCodeSVG(content, options)

创建二维码实例。`content` 为待编码字符串，必须非空；`options` 见下方选项表。

返回实例方法：

- `toSVG(opt)`：生成 SVG 字符串。`opt` 可覆盖构造时的选项，但不含 `ecl` 与 `typeNumber`。
- `toDataURL(opt)`：生成 `data:image/svg+xml;utf8,` 前缀的 dataURL，参数同 `toSVG`。

### 选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `ecl` | `M` | 纠错等级，取值 `L`、`M`、`Q`、`H` |
| `typeNumber` | `0` | 二维码版本号 1–40，`0` 表示按内容长度自动选择 |
| `padding` | `0` | 静默区宽度（模块数），`0` 表示无边框 |
| `width` | `256` | 输出宽度（像素） |
| `height` | `256` | 输出高度（像素） |
| `color` | `#000` | 模块颜色，颜色名或十六进制字符串 |
| `background` | `#fff` | 背景颜色，颜色名或十六进制字符串 |
| `container` | `svg` | 外层容器类型，取值见下表 |
| `join` | `true` | 将所有模块合并为单个 `<path>`，体积更小，推荐使用 |
| `predefined` | `false` | 以 `<defs>` 中的预定义形状配合 `<use>` 渲染模块；仅在 `join` 为 `false` 时生效 |
| `pretty` | `false` | 输出缩进与换行 |
| `swap` | `false` | 交换 X、Y 坐标，用于个别扫码器识别异常的场景 |
| `xmlDeclaration` | `false` | 在 SVG 头部添加 `<?xml version="1.0" standalone="yes"?>` 声明 |

### container 取值

| 值 | 说明 |
| --- | --- |
| `svg` | 输出带 `width`/`height` 属性的完整 SVG 文档，适合转换为位图或 PDF 等固定尺寸场景 |
| `viewbox` | 输出带 `viewBox` 属性的 SVG 文档，适合需要自适应缩放的网页 |
| `g` | 仅输出 `<g>` 分组，便于在单个 SVG 中组合多个二维码 |
| `none` | 不包裹容器，直接输出图形元素 |

## 许可证

MIT
