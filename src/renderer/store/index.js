import Vue from 'vue';
import Vuex from 'vuex';
import * as actions from './actions';
import * as getters from './getters';
import * as mutations from './mutations';

Vue.use(Vuex);

const pjson = require('../../../package.json');
const state = {
  activeTransaction: null,
  contacts: [],
  currency: null,
  currencySymbol: null,
  currentEditContact: null,
  currentLoginToWallet: null,
  currentWallet: {},
  gasClaim: null,
  holdings: [],
  latestVersion: null,
  portfolio: null,
  recentTransactions: [],
  requests: {},
  searchTransactionFromDate: null,
  searchTransactionToDate: null,
  searchTransactions: [],
  sendInProgress: false,
  showAddContactModal: false,
  showAddTokenModal: false,
  showClaimGasModal: false,
  showImportAWalletModal: false,
  showLoginToWalletModal: false,
  showPortfolioHeader: true,
  showPriceTile: true,
  showSendAddressModal: false,
  showSendRequestLedgerSignature: false,
  showSendWithLedgerModal: false,
  showWalletBackupModal: false,
  statsToken: null,
  version: pjson.version,
  wallets: [],
};

const store = new Vuex.Store({
  actions,
  getters,
  mutations,
  state,
});

export {
  actions,
  getters,
  mutations,
  state,
  store,
};
