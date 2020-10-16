可用于现代浏览器及小程序环境，用来生成svg格式的二维码，输出为base64格式。

### 用法：

```javascript
var qrcode = QRCodeSVG({
  content: "http://github.com/",
  padding: 4,
  width: 256,
  height: 256,
  color: "#000000",
  background: "#ffffff",
  ecl: "M",
});
```

### 选项

- content - QR Code content, the only required parameter
- padding - white space padding, 0 for no border
- width - QR Code width in pixels
- height - QR Code height in pixels
- color - color of modules (squares), color name or hex string, e.g. #000000
- background - color of background, color name or hex string, e.g. white
- ecl - error correction level: L, M, H, Q
- join - join modules (squares) into one shape, into the SVG path element, recommended for web and responsive use, default: true
- predefined - to create a squares as pattern, then populate the canvas, default: false
- pretty - apply indents and new lines, default: false
- swap - swap X and Y modules, only if you have issues with some QR readers, default: false
- xmlDeclaration - prepend XML declaration to the SVG document, i.e. `<?xml version="1.0" standalone="yes"?>`, default: false
- container - wrapping element, default: svg, see below

#### Container 包含:

- svg - populate squares in a SVG document with width and height attriute, recommended for converting to raster images or PDF where QR Code is being static (exact size)
- svg-viewbox - populate squares in a SVG document with viewBox attriute, recommended for responsive web pages
- g - put squares in g element, useful when you need to put multiple QR Codes in a single SVG document
- none - no wrapper
