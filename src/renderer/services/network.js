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
let currentNetwork;

export default {

  getNetworks() {
    return _.sortBy(NETWORKS, 'label');
  },

  getSelectedNetwork() {
    if (!currentNetwork) {
      const storedNetwork = storage.get(NETWORK_STORAGE_KEY);
      if (storedNetwork) {
        this.setSelectedNetwork(storedNetwork);
      } else {
        this.setSelectedNetwork(_.first(NETWORKS).value);
      }
    }
    return currentNetwork;
  },

  setSelectedNetwork(network) {
    if (loadNetworkStatusIntervalId) {
      clearInterval(loadNetworkStatusIntervalId);
    }

    currentNetwork = network;
    network.rpcClient = rpc.default.create.rpcClient(network.rpc);
    currentNetwork.lastSuccessfulRequest = moment.utc();

    this.loadStatus();
    loadNetworkStatusIntervalId = setInterval(() => {
      this.loadStatus();
    }, 10 * 1000);

    storage.set(NETWORK_STORAGE_KEY, network);
    this.sync();
    return this;
  },

  sync() {
    store.commit('setCurrentNetwork', currentNetwork);
  },

  loadStatus() {
    currentNetwork.rpcClient.getBestBlockHash()
      .then((blockHash) => {
        currentNetwork.rpcClient.getBlock(blockHash)
          .then((data) => {
            if (currentNetwork.bestBlock && currentNetwork.bestBlock.index === data.index) {
              return;
            }
            currentNetwork.bestBlock = data;
            currentNetwork.lastReceivedBlock = moment();
            storage.set(NETWORK_STORAGE_KEY, currentNetwork);
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((e) => {
        console.log(e);
      });
  },

};
