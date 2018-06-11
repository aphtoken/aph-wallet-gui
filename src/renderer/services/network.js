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
    return storage.get(NETWORK_STORAGE_KEY, _.first(NETWORKS).value);
  },

  init() {
    api.setApiSwitch(0);
    api.setSwitchFreeze(true);
    settings.networks.TestNet.extra.neonDB = null;
    settings.networks.TestNet.extra.neoscan = 'http://18.220.142.224:4000/api/test_net';
    console.log(settings);
    this.setSelectedNetwork(this.getSelectedNetwork());
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
            store.commit('setLastReceivedBlock');
            store.commit('setLastSuccessfulRequest');
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
