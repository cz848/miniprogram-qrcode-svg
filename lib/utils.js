// Utils
// Create a new array with filler
export const createArray = (length, fill) => {
  if (typeof fill === 'function') return Array.from({ length }, fill);
  return new Array(length).fill(fill);
};

export const round = value => Math.round(value * 100) / 100;
