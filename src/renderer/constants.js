import en from './l10n/en';
import de from './l10n/de';
import nl from './l10n/nl';
import cn from './l10n/cn';
import ko from './l10n/ko';
import jp from './l10n/jp';
import ru from './l10n/ru';

// i18n
const messages = {
  en,
  de,
  nl,
  cn,
  ko,
  jp,
  ru,
};

const languages = [{
  label: 'English',
  value: 'en',
}, {
  label: '中文',
  value: 'cn',
}, {
  label: 'Deutsche',
  value: 'de',
}, {
  label: '日本語',
  value: 'jp',
}, {
  label: '한국어',
  value: 'ko',
}, {
  label: 'Nederlands',
  value: 'nl',
}, {
  label: 'Русский',
  value: 'ru',
}];

const assets = {
  GAS: '602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
  NEO: 'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',

  // TODO: these different per network
  DEX_SCRIPT_HASH: '2d599f0d575232625841736bb96bd1b3d750a055',
  APH: '591eedcd379a8981edeefe04ef26207e1391904a',
  ATI: '155153854ed377549a72cc1643e481bf25b48390',

  // privnet
  /* DEX_SCRIPT_HASH: 'b102048babc8f1811f854dbc1ccf26183f45adbe',
  APH: 'aa636616119944d32ccc69a754ae6030fef8b1ac',
  ATI: '155153854ed377549a72cc1643e481bf25b48390', */
};

const charts = {
  DEBOUNCE: 500,
};

const claiming = {
  CLAIM_BLOCKS: 180, // TODO: change to reading this from the contract, will be 4800 for MainNet
  COMPOUND_BLOCKS: 180,
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
  CANCEL_ORDER: 5 * 60 * 1000,
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
  claiming,
  database,
  defaultSettings,
  formats,
  intervals,
  languages,
  loadStates,
  messages,
  orders,
  requests,
  timeouts,
};
