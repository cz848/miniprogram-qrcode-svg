import { createArray } from './utils';

/* eslint-disable no-bitwise */
const EXP_TABLE = createArray(256)
  .reduce((acc, _, i) => acc.concat(i < 8 ? 1 << i : acc[i - 4] ^ acc[i - 5] ^ acc[i - 6] ^ acc[i - 8]), []);

const LOG_TABLE = EXP_TABLE.reduce((acc, e, i) => {
  if (i !== 255) acc[e] = i;
  return acc;
}, []);

const gexp = num => {
  let n = num % 255;
  if (num !== 0 && n < 1) n += 255;
  return EXP_TABLE[n];
};

const glog = n => {
  if (n < 1) throw new Error(`glog(${n})`);
  return LOG_TABLE[n];
};

export default {
  gexp,
  glog,
};
