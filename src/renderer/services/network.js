import _ from 'lodash';
import { rpc, settings, api } from '@cityofzion/neon-js';

import { store } from '../store';
import storage from './storage';
import { intervals } from '../constants';

const NETWORK_STORAGE_KEY = 'network';
const NETWORKS = [
  {
    label: 'MainNet',
    value: {
      aph: 'https://mainnet.aphelion-neo.com:62443/api',
      net: 'MainNet',
      rpc: 'https://mainneo.aphelion-neo.com:10331',
      fee: 0,
    },
  },
  {
    label: 'TestNet',
    value: {
      aph: 'https://testnet.aphelion-neo.com:62443/api',
      net: 'TestNet',
      rpc: 'https://testneo.aphelion-neo.com:20331',
      fee: 0,
    },
  },
  /* {
    label: 'PrivNet',
    value: {
      aph: 'http://localhost:62433/api',
      net: 'PrivNet',
      rpc: 'http://localhost:30338',
      fee: 0,
    },
  }, */
];

const NETWORK_FEE_OPTIONS = [
  0,
  0.00000001,
  0.0000001,
  0.000001,
  0.00001,
  0.0001,
  0.001,
  0.01,
  0.1,
];

let loadNetworkStatusIntervalId;

export default {
  getNetworks() {
    return _.sortBy(NETWORKS, 'label');
  },

  getNetworkFees() {
    return NETWORK_FEE_OPTIONS;
  },

  getRpcClient() {
    return rpc.default.create.rpcClient(this.getSelectedNetwork().rpc);
  },

  getSelectedNetwork() {
    return storage.get(NETWORK_STORAGE_KEY, _.first(NETWORKS).value);
  },

  getSelectedNetworkFee() {
    return storage.get(NETWORK_STORAGE_KEY, _.first(NETWORKS).value);
  },

  init() {
    this.setSelectedNetwork(this.getSelectedNetwork());
  },

  setExplorer(useAphExplorer) {
    // freeze to neoscan for any calls that neon-js uses to switch.loadBalance
    api.setApiSwitch(0);
    api.setSwitchFreeze(true);

    settings.timeout.rpc = 10000;
    if (useAphExplorer === true) {
      settings.networks.MainNet.extra.neoscan = 'https://explorer.aphelion-neo.com:4443/api/main_net';
      settings.networks.TestNet.extra.neoscan = 'https://test-explorer.aphelion-neo.com:4443/api/test_net';
    } else {
      settings.networks.MainNet.extra.neoscan = 'https://api.neoscan.io/api/main_net';
      settings.networks.TestNet.extra.neoscan = 'https://neoscan-testnet.io/api/test_net';
    }
  },

  loadStatus() {
    const network = this.getSelectedNetwork();
    const rpcClient = this.getRpcClient();

    rpcClient.getBestBlockHash()
      .then((blockHash) => {
        if (network.bestBlock && network.bestBlock.hash === blockHash) {
          // Don't redundantly fetch the block we already fetched.
          return;
        }

        rpcClient.query({
          method: 'getblockheader',
          params: [blockHash, true],
        })
          .then((res) => {
            const data = res.result;
            if (network.bestBlock && network.bestBlock.index === data.index) {
              // This should never happen now with the previous check above to not redundantly fetch the same block.
              return;
            }
            store.commit('setLastReceivedBlock');
            store.commit('setLastSuccessfulRequest');
            // TODO: We should keep a cache with some information about blocks indexed by block hash.
            this.normalizeAndStore(_.set(network, 'bestBlock', data)).sync();
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((e) => {
        console.log(e);
      });
  },

  normalizeAndStore(network) {
    storage.set(NETWORK_STORAGE_KEY, network);

    return this;
  },

  setSelectedNetwork(network) {
    this.normalizeAndStore(network).sync();

    if (loadNetworkStatusIntervalId) {
      clearInterval(loadNetworkStatusIntervalId);
    }

    if (network.net === 'PrivNet') {
      const config = {
        name: 'PrivNet',
        extra: {
          neoscan: 'http://localhost:4000/api/main_net',
        },
      };
      const privateNet = new rpc.Network(config);
      settings.addNetwork(privateNet, true);
    }

    this.loadStatus();
    loadNetworkStatusIntervalId = setInterval(() => {
      this.loadStatus();
    }, intervals.NETWORK_STATUS);

    return this;
  },

  sync() {
    store.commit('setCurrentNetwork', this.getSelectedNetwork());
  },

};
