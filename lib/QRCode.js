import { QRErrorCorrectLevel } from './constants';
import { round } from './utils';
import QRCodeModel from './QRCodeModel';

// class QRCode
const QRCodeLimitLength = [
  [17, 14, 11, 7],
  [32, 26, 20, 14],
  [53, 42, 32, 24],
  [78, 62, 46, 34],
  [106, 84, 60, 44],
  [134, 106, 74, 58],
  [154, 122, 86, 64],
  [192, 152, 108, 84],
  [230, 180, 130, 98],
  [271, 213, 151, 119],
  [321, 251, 177, 137],
  [367, 287, 203, 155],
  [425, 331, 241, 177],
  [458, 362, 258, 194],
  [520, 412, 292, 220],
  [586, 450, 322, 250],
  [644, 504, 364, 280],
  [718, 560, 394, 310],
  [792, 624, 442, 338],
  [858, 666, 482, 382],
  [929, 711, 509, 403],
  [1003, 779, 565, 439],
  [1091, 857, 611, 461],
  [1171, 911, 661, 511],
  [1273, 997, 715, 535],
  [1367, 1059, 751, 593],
  [1465, 1125, 805, 625],
  [1528, 1190, 868, 658],
  [1628, 1264, 908, 698],
  [1732, 1370, 982, 742],
  [1840, 1452, 1030, 790],
  [1952, 1538, 1112, 842],
  [2068, 1628, 1168, 898],
  [2188, 1722, 1228, 958],
  [2303, 1809, 1283, 983],
  [2431, 1911, 1351, 1051],
  [2563, 1989, 1423, 1093],
  [2699, 2099, 1499, 1139],
  [2809, 2213, 1579, 1219],
  [2953, 2331, 1663, 1273],
];

// Gets the error correction level
const getErrorCorrectLevel = ecl => {
  if (!(ecl in QRErrorCorrectLevel)) throw new Error(`Unknwon error correction level: ${ecl}`);
  return QRErrorCorrectLevel[ecl];
};

// Gets text length
const getUTF8Length = content => {
  const result = encodeURI(content).replace(/%[\da-f]{2}/ig, 'a');
  return result.length + (result.length !== +content ? 3 : 0);
};

// Get type number
const getTypeNumber = (content, ecl) => {
  const length = getUTF8Length(content);

  let type = 1;
  let limit = 0;
  QRCodeLimitLength.every(table => {
    if (!table) throw new Error(`Content too long: expected ${limit} but got ${length}`);
    if (!/^[LMQH]$/.test(ecl)) throw new Error(`Unknown error correction level: ${ecl}`);

    limit = table[{ L: 0, M: 1, Q: 2, H: 3 }[ecl]];

    if (length <= limit) return false;

    type += 1;

    return true;
  });

  if (type > QRCodeLimitLength.length) throw new Error('Content too long');

  return type;
};

/** Constructor */
export default class QRCode {
  constructor(content, options) {
    this.setOptions(options);
    this.init(content);
  }

  setOptions(options) {
    // Default options
    this.options = {
      typeNumber: 0, // The minimum QR code type number from 1 to 40
      ecl: 'M', // Error correction level
      width: 256,
      height: 256,
      padding: 0,
      color: '#000',
      background: '#fff',
      container: 'svg', // Wrapping element
      xmlDeclaration: false, // Apply <?xml...?> declaration in SVG?
      pretty: false, // Apply new lines and indents in SVG?
      join: true, // Join (union, merge) rectangles into one shape?
      swap: false, // Swap the X and Y modules, pull request #2
      predefined: false, // Populate with predefined shape instead of "rect" elements, thanks to @kkocdko
      ...options,
    };
  }

  init(content) {
    const { padding, width, height } = this.options;
    if (typeof content !== 'string') throw new Error("Expected 'content' as string!");
    if (content.length === 0) throw new Error("Expected 'content' to be non-empty!");
    if (!(padding >= 0)) throw new Error("Expected 'padding' value to be non-negative!");
    if (!width > 0 || !height > 0) throw new Error("Expected 'width' or 'height' value to be higher than zero!");

    // Generate QR Code matrix
    const { ecl, typeNumber } = this.options;
    const type = typeNumber || getTypeNumber(content, ecl);
    this.qrcode = new QRCodeModel(type, getErrorCorrectLevel(ecl));
    this.qrcode.addData(content);
    this.qrcode.make();
  }

  // Generates QR Code as SVG image
  toSVG(opt) {
    const options = { ...this.options, ...opt };
    const {
      width,
      height,
      padding,
      color,
      background,
      container,
      xmlDeclaration,
      pretty,
      join,
      swap,
      predefined,
    } = options;

    const { modules } = this.qrcode;
    const { length } = modules;
    const indent = pretty ? '  ' : '';
    const eol = pretty ? '\r\n' : '';
    const xsize = width / (length + 2 * padding);
    const ysize = height / (length + 2 * padding);
    const defs = predefined ? `${indent}<defs><path id="qrmodule" d="M0 0 h${ysize} v${xsize} H0 z" fill="${color}" shape-rendering="crispEdges"/></defs>${eol}` : '';
    // Background rectangle
    const bgrect = `${indent}<rect x="0" y="0" width="${width}" height="${height}" fill="${background}" shape-rendering="crispEdges"/>${eol}`;

    // Rectangles representing modules
    let modrect = '';
    let pathdata = '';

    for (let y = 0; y < length; y++) {
      for (let x = 0; x < length; x++) {
        if (modules[x][y]) {
          let px = round(x * xsize + padding * xsize);
          let py = round(y * ysize + padding * ysize);

          // Some users have had issues with the QR Code, thanks to @danioso for the solution
          if (swap) {
            [px, py] = [py, px];
          }

          if (join) {
            // Module as a part of svg path data, thanks to @danioso
            const w = round(xsize + px);
            const h = round(ysize + py);

            pathdata += `M${px},${py} V${h} H${w} V${py} H${px} Z `;
          } else if (predefined) {
            // Module as a predefined shape, thanks to @kkocdko
            modrect += `${indent}<use x="${px}" y="${py}" href="#qrmodule"/>${eol}`;
          } else {
            // Module as rectangle element
            modrect += `${indent}<rect x="${px}" y="${py}" width="${xsize}" height="${ysize}" fill="${color}" shape-rendering="crispEdges"/>${eol}`;
          }
        }
      }
    }

    if (join) modrect = `${indent}<path x="0" y="0" fill="${color}" shape-rendering="crispEdges" d="${pathdata}"/>${eol}`;

    const rect = defs + bgrect + modrect;

    let svg = '';
    let box = `width="${width}" height="${height}"`;
    if (container === 'viewbox') box = `viewBox="0 0 ${width} ${height}"`;

    if (['svg', 'viewbox'].includes(container)) {
      // Wrapped in SVG document
      // or viewbox for responsive use in a browser, thanks to @danioso
      if (xmlDeclaration) svg += `<?xml version="1.0" standalone="yes"?>${eol}`;
      svg += `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ${box}>${eol}${rect}</svg>`;
    } else if (container === 'g') {
      // Wrapped in group element
      svg += `<g ${box}>${eol}${rect}</g>`;
    } else {
      // Without a container
      svg += rect.replace(/^\s+/, ''); // Clear indents on each line
    }

    return svg;
  }

  toDataURL(opt) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(this.toSVG(opt))}`;
  }
}
