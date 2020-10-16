/**
 * 受pure-svg-code/qrcode启发，融合了davidshimjs/qrcodejs和papnkukn/qrcode-svg
 */
import QRCode from './lib/QRCode';

export default (content, options) => new QRCode(content, options).toDataURL();
