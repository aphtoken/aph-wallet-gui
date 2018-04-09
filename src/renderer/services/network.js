import lockr from 'lockr';
import _ from 'lodash';
import moment from 'moment';
import {
  rpc,
} from '@cityofzion/neon-js';

const NETWORK_STORAGE_KEY = 'aph.network';
const NETWORKS = [
  {
    label: 'TestNet',
    value: {
      aph: 'http://test1.aphelion-neo.com:62433/api',
      net: 'TestNet',
      rpc: 'http://test1.aphelion-neo.com:30333',
    },
  },
  {
    label: 'MainNet',
    value: {
      aph: 'http://aph-api1.aphelion-neo.com:62433/api',
      net: 'MainNet',
      rpc: 'http://seed1.aphelion-neo.com:10332',
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
      this.setSelectedNetwork(_.first(NETWORKS).value);
    }
    return currentNetwork;
  },

  setSelectedNetwork(network) {
    if (loadNetworkStatusIntervalId) {
      clearInterval(loadNetworkStatusIntervalId);
    }

    currentNetwork = network;
    network.rpcClient = rpc.default.create.rpcClient(network.rpc);

    this.loadStatus();
    loadNetworkStatusIntervalId = setInterval(() => {
      this.loadStatus();
    }, 15000);

    lockr.set(NETWORK_STORAGE_KEY, network);
    return this;
  },

  loadStatus() {
    currentNetwork.rpcClient.getBestBlockHash()
      .then((blockHash) => {
        currentNetwork.rpcClient.getBlock(blockHash)
          .then((data) => {
            currentNetwork.bestBlock = data;
            currentNetwork.lastReceivedBlock = moment();
            lockr.set(NETWORK_STORAGE_KEY, currentNetwork);
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
