/* eslint-disable id-length */
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
  label: 'Deutsch',
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

const charts = {
  DEBOUNCE: 500,
};

const claiming = {
  DEFAULT_CLAIM_BLOCKS: 180,
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
  COMPLETE_SYSTEM_WITHDRAWALS: 15 * 60 * 1000,
  GAS_FRACTURE_NOTIFICATION: 15 * 60 * 1000,
  HOLDINGS_POLLING: 30 * 1000,
  MARKETS_POLLING: 5 * 60 * 1000,
  NETWORK_STATUS: 10 * 1000,
  REBROADCAST_TRANSACTIONS: 30 * 1000,
  TOKENS_POLLING: 15 * 60 * 1000,
  TOKENS_BALANCES_POLL_ALL: 5 * 60 * 1000,
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
  BALANCE_PERSIST_FOR: 5 * 60 * 1000,
  CANCEL_ORDER: 5 * 60 * 1000,
  MONITOR_TRANSACTIONS: 10 * 60 * 1000,
  NEO_API_CALL: 500,
  RENDER_CHART: 100,
  RENDER_SPINNER: 2000,
  TRANSACTION: 5 * 60 * 1000,
  TRANSACTION_WITH_HARDWARE: 8 * 60 * 1000,
  WEBSOCKET_CONNECTION: 10 * 1000,
};

export {
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
