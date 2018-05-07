const charts = {
  DEBOUNCE: 500,
};

const database = {
  NAME: 'aphelion.db',
};

const defaultSettings = {
  CURRENCY: 'USD',
};

const formats = {
  DATE: 'DD-MM-YYYY',
  DATE_SHORT: 'DD-MM',
  FRACTIONAL_NUMBER: '[.]0[00000000]',
  MONEY: '$0,0.00',
  TIME: 'H:ss',
  WEEKDAY_AND_TIME: 'dd H:ss',
  WHOLE_NUMBER: '0,0',
  WHOLE_NUMBER_NO_COMMAS: '0[.]0[00000000]',
};

const intervals = {
  NETWORK_STATUS: 10 * 1000,
  POLLING: 15000,
  WALLET_VERSION_CHECK: 10 * 60 * 1000,
};

const loadStates = {
  FAILED: 'FAILED',
  LOADING: 'LOADING',
  READY: 'READY',
};

const requests = {
  FAILED: 'failed',
  PENDING: 'pending',
  SUCCESS: 'success',
};

const timeouts = {
  NEO_API_CALL: 500,
  RENDER_CHART: 100,
  TRANSACTION: 30 * 1000,
  TRANSACTION_WITH_HARDWARE: 3 * 60 * 1000,
};

export {
  charts,
  database,
  defaultSettings,
  formats,
  intervals,
  loadStates,
  requests,
  timeouts,
};

