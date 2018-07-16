import en from './l10n/en';
import de from './l10n/de';

// i18n
const messages = {
  en,
  de,
};

const langs = [
  'en',
  'de',
];

const assets = {
  GAS: '602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
  NEO: 'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',

  // TODO: these different per network
  DEX_SCRIPT_HASH: '927e87a5a86581cf1345ce40edde64ed40e4994f',
  APH: '591eedcd379a8981edeefe04ef26207e1391904a',
  ATI: '155153854ed377549a72cc1643e481bf25b48390',

  // privnet
  /* DEX_SCRIPT_HASH: '8da505f3025bede243323ea3e3ccf0785b129e83',
  APH: 'aa636616119944d32ccc69a754ae6030fef8b1ac',
  ATI: 'a9ffe1c85f55d0545898a9e749cde53c05151760', */
};

const charts = {
  DEBOUNCE: 500,
};

const database = {
  NAME: 'aphelion.db',
};

const defaultSettings = {
  CURRENCY: 'USD',
  STYLE: 'Day',
};

const formats = {
  DATE: 'DD-MM-YYYY',
  DATE_SHORT: 'DD-MM',
  FRACTIONAL_NUMBER: '[.]0[00000000]',
  MONEY: '$0,0.00',
  TIME: 'H:mm',
  WEEKDAY_AND_TIME: 'dd H:ss',
  WHOLE_NUMBER: '0,0',
  WHOLE_NUMBER_NO_COMMAS: '0[.]0[00000000]',
};

const intervals = {
  BLOCK: 20 * 1000,
  HOLDINGS_POLLING: 30 * 1000,
  NETWORK_STATUS: 10 * 1000,
  REBROADCAST_TRANSACTIONS: 30 * 1000,
  TOKENS_POLLING: 15 * 60 * 1000,
  TRANSACTIONS_POLLING: 15 * 1000,
  WALLET_VERSION_CHECK: 10 * 60 * 1000,
};

const loadStates = {
  FAILED: 'FAILED',
  LOADING: 'LOADING',
  READY: 'READY',
};

const orders = {
  ALL_SWITCH: 'All',
};

const requests = {
  FAILED: 'failed',
  PENDING: 'pending',
  SUCCESS: 'success',
};

const timeouts = {
  MONITOR_TRANSACTIONS: 10 * 60 * 1000,
  NEO_API_CALL: 500,
  RENDER_CHART: 100,
  TRANSACTION: 5 * 60 * 1000,
  TRANSACTION_WITH_HARDWARE: 8 * 60 * 1000,
  WEBSOCKET_CONNECTION: 10 * 1000,
};

export {
  assets,
  charts,
  database,
  defaultSettings,
  formats,
  intervals,
  langs,
  loadStates,
  messages,
  orders,
  requests,
  timeouts,
};

