import Vue from 'vue';
import Vuex from 'vuex';
import moment from 'moment';

import * as actions from './actions';
import * as getters from './getters';
import * as mutations from './mutations';

Vue.use(Vuex);

const pjson = require('../../../package.json');

const state = {
  acceptCommitInfo: false,
  acceptDexDemoVersion: false,
  acceptDexOutOfDate: false,
  activeTransaction: null,
  assetsThatNeedRefresh: [],
  claimModalModel: null,
  commitModalModel: null,
  commitState: null,
  contacts: [],
  currency: null,
  currencySymbol: null,
  currentEditContact: null,
  currentLoginToWallet: null,
  currentMarket: null,
  currentNetwork: null,
  currentWallet: null,
  depositWithdrawModalModel: null,
  gasClaim: null,
  holdings: [],
  lastReceivedBlock: null,
  lastSuccessfulRequest: null,
  latestVersion: null,
  markets: [],
  menuToggleable: false,
  menuCollapsed: true,
  needsWsReconnectHandling: false,
  nep5Balances: {},
  orderBook: null,
  orderHistory: null,
  orderPrice: '',
  orderQuantity: '',
  orderToConfirm: false,
  ordersToShow: '',
  portfolio: null,
  recentTransactions: [],
  requests: {},
  searchTransactionFromDate: moment().startOf('day').subtract(7, 'days'),
  searchTransactionToDate: null,
  searchTransactions: [],
  sendInProgress: false,
  sendModel: {},
  showAddContactModal: false,
  showAddTokenModal: false,
  showClaimGasModal: false,
  showImportAWalletModal: false,
  showLoginToWalletModal: false,
  showOrderConfirmationModal: false,
  showPortfolioHeader: true,
  showPriceTile: true,
  showSendAddressModal: false,
  showSendRequestLedgerSignature: false,
  showSendWithLedgerModal: false,
  showWalletBackupModal: false,
  socket: {
    lastMessage: null,
    isConnected: false,
    client: null,
    reconnectError: false,
  },
  statsToken: null,
  styleMode: 'Night',
  tradeHistory: null,
  transactionDetails: {},
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
