import _ from 'lodash';
import moment from 'moment';
import { rpc } from '@cityofzion/neon-js';

import { store } from '../store';
import storage from './storage';

const NETWORK_STORAGE_KEY = 'network';
const NETWORKS = [
  {
    label: 'MainNet',
    value: {
      aph: 'https://mainnet.aphelion-neo.com:62443/api',
      net: 'MainNet',
      rpc: 'https://mainneo.aphelion-neo.com:10331',
    },
  },
  {
    label: 'TestNet',
    value: {
      aph: 'https://testnet.aphelion-neo.com:62443/api',
      net: 'TestNet',
      rpc: 'https://testneo.aphelion-neo.com:20331',
    },
  },
];

let loadNetworkStatusIntervalId;

export default {
  getNetworks() {
    return _.sortBy(NETWORKS, 'label');
  },

  getRpcClient() {
    return rpc.default.create.rpcClient(this.getSelectedNetwork().rpc);
  },

  getSelectedNetwork() {
    return storage.get(NETWORK_STORAGE_KEY) || _.first(NETWORKS).value;
  },

  loadStatus() {
    const network = this.getSelectedNetwork();
    const rpcClient = this.getRpcClient();

    rpcClient.getBestBlockHash()
      .then((blockHash) => {
        rpcClient.getBlock(blockHash)
          .then((data) => {
            if (network.bestBlock && network.bestBlock.index === data.index) {
              return;
            }
            network.bestBlock = data;
            network.lastReceivedBlock = moment();
            this.normalizeAndStore(network);
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
  },

  setSelectedNetwork(network) {
    if (loadNetworkStatusIntervalId) {
      clearInterval(loadNetworkStatusIntervalId);
    }

    network.lastSuccessfulRequest = moment.utc();

    this.loadStatus();
    loadNetworkStatusIntervalId = setInterval(() => {
      this.loadStatus();
    }, 10 * 1000);

    this.normalizeAndStore(network);
    this.sync();

    return this;
  },

  sync() {
    store.commit('setCurrentNetwork', storage.get(NETWORK_STORAGE_KEY));
  },

};
