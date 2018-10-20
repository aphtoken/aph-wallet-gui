export const acceptCommitInfo = state => state.acceptCommitInfo;
export const acceptDexDemoVersion = state => state.acceptDexDemoVersion[state.currentNetwork.net];
export const acceptDexOutOfDate = state => state.acceptDexOutOfDate;
export const activeTransaction = state => state.activeTransaction;
export const claimModalModel = state => state.claimModalModel;
export const commitModalModel = state => state.commitModalModel;
export const commitState = state => state.commitState;
export const contacts = state => state.contacts;
export const currency = state => state.currency;
export const currencySymbol = state => state.currencySymbol;
export const currentEditContact = state => state.currentEditContact;
export const currentLoginToWallet = state => state.currentLoginToWallet;
export const currentNetwork = state => state.currentNetwork;
export const currentWallet = state => state.currentWallet;
export const depositWithdrawModalModel = state => state.depositWithdrawModalModel;
export const fractureGasModalModel = state => state.fractureGasModalModel;
export const holdings = state => state.holdings;
export const lastReceivedBlock = state => state.lastReceivedBlock;
export const lastSuccessfulRequest = state => state.lastSuccessfulRequest;
export const latestVersion = state => state.latestVersion;
export const markets = state => state.markets;
export const menuCollapsed = state => state.menuCollapsed;
export const menuToggleable = state => state.menuToggleable;
export const nep5Balances = state => state.nep5Balances;
export const orderBook = state => state.orderBook;
export const orderHistory = state => state.orderHistory;
export const orderToConfirm = state => state.orderToConfirm;
export const ordersToShow = state => state.ordersToShow;
export const portfolio = state => state.portfolio;
export const recentTransactions = state => state.recentTransactions;
export const requests = state => state.requests;
export const searchTransactionFromDate = state => state.searchTransactionFromDate;
export const searchTransactionToDate = state => state.searchTransactionToDate;
export const searchTransactions = state => state.searchTransactions;
export const sendInProgress = state => state.sendInProgress[state.currentNetwork.net];
export const sendModel = state => state.sendModel[state.currentNetwork.net];
export const showAddContactModal = state => state.showAddContactModal;
export const showAddTokenModal = state => state.showAddTokenModal;
export const showLearnMore = state => state.showLearnMore;
export const showOrderConfirmationModal = state => state.showOrderConfirmationModal;
export const showPortfolioHeader = state => state.showPortfolioHeader;
export const showSendAddressModal = state => state.showSendAddressModal;
export const showWalletBackupModal = state => state.showWalletBackupModal;
export const statsToken = state => state.statsToken;
export const tradeHistory = state => state.tradeHistory;
export const transactionDetails = state => state.transactionDetails;
export const version = state => state.version;
export const wallets = state => state.wallets;
export const websocketUri = state => _.get(state.currentNetwork, 'websocketUri');
export const tickerData = (state) => {
  return state.currentMarket ? state.tickerDataByMarket[state.currentMarket.marketName] : {};
};
