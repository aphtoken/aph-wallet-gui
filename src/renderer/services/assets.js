import network from './network';
import storage from './storage';
import wallets from './wallets';

const ASSETS_STORAGE_KEY = net => `assets_${net}`;
const ASSETS_ADDED_STORAGE_KEY = (net, wallet) => `assets_${net}_${wallet.address}`;

export default {
  GAS: '602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
  NEO: 'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',

  updateNetworkAssets(assets) {
    const currentNetwork = network.getSelectedNetwork();
    if (!currentNetwork) {
      return;
    }

    const neo = {
      symbol: 'NEO',
      assetId: this.NEO,
      name: 'NEO',
      decimals: 0,
    };
    const gas = {
      symbol: 'GAS',
      assetId: this.GAS,
      name: 'GAS',
      decimals: 8,
    };

    let aphToken = null;
    if (currentNetwork.net === 'MainNet') {
      aphToken = {
        symbol: 'APH',
        assetId: 'a0777c3ce2b169d4a23bcba4565e3225a0122d95',
        name: 'Aphelion',
        decimals: 8,
      };
    } else if (currentNetwork.net === 'TestNet') {
      aphToken = {
        symbol: 'APH',
        assetId: '591eedcd379a8981edeefe04ef26207e1391904a',
        name: 'Aphelion',
        decimals: 8,
      };
    } else if (currentNetwork.net === 'PrivNet') {
      aphToken = {
        symbol: 'APH',
        assetId: 'fe8ad8a261b171fb313cbfb0d4a974e269d11061',
        name: 'Aphelion',
        decimals: 8,
      };
    }

    this.addNetworkAsset(neo, true);
    this.addNetworkAsset(gas, true);
    this.addNetworkAsset(aphToken, true);

    storage.set(ASSETS_STORAGE_KEY(currentNetwork.net), assets);
  },

  getNetworkAssets() {
    const currentNetwork = network.getSelectedNetwork();
    return storage.get(ASSETS_STORAGE_KEY(currentNetwork.net));
  },

  getNetworkAssetsAsArray() {
    return _.sortBy(_.values(this.getNetworkAssets()), [token => token.symbol.toLowerCase()], ['symbol']);
  },

  getNetworkAsset(assetId) {
    return _.get(this.getNetworkAssets(), assetId);
  },

  networkAssetExists(assetId) {
    return _.has(this.getNetworkAssets(), assetId);
  },

  addNetworkAsset(asset, addToUserAssets) {
    if (!asset) {
      return;
    }

    const currentNetwork = network.getSelectedNetwork();
    const assets = this.getNetworkAssets();
    _.set(assets, asset.assetId, asset);
    storage.set(ASSETS_STORAGE_KEY(currentNetwork.net), assets);

    if (addToUserAssets && !this.userAssetExists(asset.assetId)) {
      this.addUserAsset(asset.assetId);
    }
  },

  addUserAsset(assetId) {
    if (this.networkAssetExists(assetId) === false) {
      return;
    }

    const currentNetwork = network.getSelectedNetwork();
    const currentWallet = wallets.getCurrentWallet();

    if (!currentNetwork || !currentWallet) {
      return;
    }

    const assets = this.getNetworkAssets();
    const userAssets = _.set(this.getUserAssets(), assetId, _.get(assets, assetId));
    // console.log(`Adding user asset ${asset.symbol}`)

    storage.set(ASSETS_ADDED_STORAGE_KEY(currentNetwork.net, currentWallet), userAssets);
  },

  removeUserAsset(assetId) {
    const currentNetwork = network.getSelectedNetwork();
    const currentWallet = wallets.getCurrentWallet();

    if (!currentNetwork || !currentWallet) {
      return;
    }

    let userAssets = this.getUserAssets();

    if (_.has(userAssets, assetId)) {
      // console.log(`Removing user asset: ${assetId}`)
      userAssets = _.omit(userAssets, assetId);
      storage.set(ASSETS_ADDED_STORAGE_KEY(currentNetwork.net, currentWallet), userAssets);
    }
  },

  getUserAssets() {
    const currentNetwork = network.getSelectedNetwork();
    const currentWallet = wallets.getCurrentWallet();

    if (!currentNetwork || !currentWallet) {
      return {};
    }

    return storage.get(ASSETS_ADDED_STORAGE_KEY(currentNetwork.net, currentWallet), {});
  },

  getUserAssetsAsArray() {
    return _.sortBy(_.values(this.getUserAssets()),
      [token => token.symbol.toLowerCase()], ['symbol']);
  },

  userAssetExists(assetId) {
    return _.has(this.getUserAssets(), assetId);
  },
};
