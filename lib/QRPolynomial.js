import { createArray } from './utils';
import QRMath from './QRMath';

// class QRPolynomial
/* eslint-disable no-bitwise */
export default class QRPolynomial {
  constructor(num, shift) {
    this.init(num, shift);
  }

  init(num, shift) {
    if (num.length === undefined) throw new Error(`${num}.length/${shift}`);
    let offset = 0;
    while (offset < num.length && num[offset] === 0) {
      offset += 1;
    }
    this.num = createArray(num.length - offset, (_, i) => num[i + offset]).concat(new Array(shift));
  }

  get(index) {
    return this.num[index];
  }

  getLength() {
    return this.num.length;
  }

  multiply(that) {
    const thisLength = this.getLength();
    const thatLength = that.getLength();
    const num = new Array(thisLength + thatLength - 1);
    for (let i = 0; i < thisLength; i++) {
      for (let j = 0; j < thatLength; j++) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(that.get(j)));
      }
    }
    return new QRPolynomial(num, 0);
  }

  mod(that) {
    if (this.getLength() < that.getLength()) return this;
    const ratio = QRMath.glog(this.get(0)) - QRMath.glog(that.get(0));
    const num = [].concat(this.num);
    for (let i = 0; i < that.getLength(); i++) {
      num[i] ^= QRMath.gexp(QRMath.glog(that.get(i)) + ratio);
    }
    return new QRPolynomial(num, 0).mod(that);
  }
}
