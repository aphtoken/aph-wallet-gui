const formats = {
  DATE: 'DD-MM-YYYY',
  DATE_SHORT: 'DD-MM',
  MONEY: '$0,0.00',
  NUMBER: '0,0[.]0[0000000]',
  NUMBER_SHORT: '0,0[.]0[0]',
  TIME: 'LTC',
};

const intervals = {
  POLLING: 15000,
};

const loadStates = {
  FAILED: 'FAILED',
  LOADING: 'LOADING',
  READY: 'READY',
};

export {
  formats,
  intervals,
  loadStates,
};

