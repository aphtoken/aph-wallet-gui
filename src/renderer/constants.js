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
  MONEY: '$0,0.00',
  NUMBER: '0,0[.]0[00000000]',
  NUMBER_SHORT: '0,0[.]0[0]',
  TIME: 'LTC',
};

const intervals = {
  POLLING: 15000,
  WALLET_VERSION_CHECK: 10 * 60 * 1000,
  TRANSACTIONTIMEOUT: 30 * 1000,
  TRANSACTIONTIMEOUTWITHHARDWARE: 3 * 60 * 1000,
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

