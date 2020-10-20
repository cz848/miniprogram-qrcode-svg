可用于现代浏览器及小程序环境，用来生成svg格式的二维码，输出为svg格式的字符串或其base64形式。

### 用法：

```javascript
import qrCodeSVG from 'miniprogram-qrcode-svg';

const qrcode = qrCodeSVG("http://github.com/", {
  padding: 4,
  width: 256,
  height: 256,
  color: "#000000",
  background: "#ffffff",
  ecl: "M",
}).toSVG();
```

### 选项

- ecl: error correction level: L, M, H, Q
- typeNumber: QR code type number from 1 to 40, default: 0 for auto detection
- padding: white space padding, 0 for no border
- width: QR Code width in pixels
- height: QR Code height in pixels
- color: color of modules (squares), color name or hex string, e.g. #000000
- background: color of background, color name or hex string, e.g. white
- join: join modules (squares) into one shape, into the SVG path element, recommended for web and responsive use, default: true
- predefined: to create a squares as pattern, then populate the canvas, default: false
- pretty: apply indents and new lines, default: false
- swap: swap X and Y modules, only if you have issues with some QR readers, default: false
- xmlDeclaration: prepend XML declaration to the SVG document, i.e. `<?xml version="1.0" standalone="yes"?>`, default: false
- container: wrapping element, default: svg, see below

#### Container 包含:

- svg: populate squares in a SVG document with width and height attriute, recommended for converting to raster images or PDF where QR Code is being static (exact size)
- svg-viewbox: populate squares in a SVG document with viewBox attriute, recommended for responsive web pages
- g: put squares in g element, useful when you need to put multiple QR Codes in a single SVG document
- none: no wrapper

### 方法

- toSVG(opt): genarate as svg format, `opt` is the options above except ecl and typeNumber.
- toDataURL(opt): genarate as svg dataURL, `opt` is the options above except ecl and typeNumber.
