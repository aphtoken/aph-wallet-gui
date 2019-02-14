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
      aph: 'https://mainnet.aphelion-neo.com/api',
      aph_hash: 'a0777c3ce2b169d4a23bcba4565e3225a0122d95',
      dex_hash: '9488220e8654d798f9b9cb9e74bd611ecc83fd0f',
      net: 'MainNet',
      rpc: 'https://mainneo.aphelion-neo.com:10331',
      fee: 0,
      websocketUri: 'wss://mainnet.aphelion-neo.com:62443/ws',
      kycUrl: 'https://regtech.identitymind.store/viewform/mc99c/',
    },
  },
  {
    label: 'TestNet',
    value: {
      aph: 'https://testnet.aphelion-neo.com:62443/api',
      aph_hash: '591eedcd379a8981edeefe04ef26207e1391904a',
      ati_hash: '155153854ed377549a72cc1643e481bf25b48390',
      dex_hash: '6bc1ae05a6694357a6db104231d56aa9427e63e4',
      net: 'TestNet',
      rpc: 'https://testneo.aphelion-neo.com:20331',
      fee: 0,
      websocketUri: 'wss://testnet.aphelion-neo.com:62443/ws',
      kycUrl: 'https://regtech.identitymind.store/viewform/z3wy8/',
    },
  },
  /*
  {
    label: 'PrivNet',
    value: {
      aph_hash: 'fe8ad8a261b171fb313cbfb0d4a974e269d11061',
      ati_hash: 'a9ffe1c85f55d0545898a9e749cde53c05151760',
      dex_hash: '7a98dd1c56cef63522a9407d29d1bd25ebb323dd',
      aph: 'http://localhost:62433/api',
      net: 'PrivNet',
      rpc: 'http://localhost:30338',
      fee: 0,
      websocketUri: 'ws://localhost:62433/ws',
      kycUrl: 'https://regtech.identitymind.store/viewform/z3wy8/',
    },
  },
  */
];

const NETWORK_FEE_OPTIONS = [
  0,
  0.00000001,
  0.0000001,
  0.000001,
  0.00001,
  0.0001,
  0.001,
  0.002,
  0.005,
  0.007,
  0.01,
  0.1,
];

let loadNetworkStatusIntervalId;

export default {
  getNetworkFees() {
    return NETWORK_FEE_OPTIONS;
  },

  getNetworks() {
    return _.sortBy(NETWORKS, 'label');
  },

  getRpcClient() {
    return rpc.default.create.rpcClient(this.getSelectedNetwork().rpc);
  },

  getSelectedNetwork() {
    const network = storage.get(NETWORK_STORAGE_KEY, _.first(NETWORKS).value);
    this.normalize(network);
    return network;
  },

  init() {
    this.setSelectedNetwork(this.getSelectedNetwork());
  },

  setExplorer(useAphExplorer) {
    // freeze to neoscan for any calls that neon-js uses to switch.loadBalance
    api.setApiSwitch(0);
    api.setSwitchFreeze(true);

    settings.timeout.rpc = 16000;
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

        store.dispatch('fetchBlockHeaderByHash', { blockHash,
          done: ((data) => {
            // Make sure network didn't change and that we aren't operating off a state copy of network.
            if (network.net !== this.getSelectedNetwork().net) {
              return;
            }
            store.commit('setLastReceivedBlock');
            store.commit('setLastSuccessfulRequest');

            this.normalizeAndStore(_.set(network, 'bestBlock', data)).sync();
          }),
          failed: ((e) => {
            console.log(e);
          }) });
      })
      .catch((e) => {
        console.log(e);
      });
  },

  normalize(network) {
    let defaultForNetwork = _.find(NETWORKS, ({ value }) => {
      return value.net === network.net;
    });

    if (!defaultForNetwork) return this;
    defaultForNetwork = defaultForNetwork.value;

    if (!network.fee) {
      network.fee = defaultForNetwork.fee;
    }

    // Force the dex and aph hash to match the network setting even if what is saved doesn't match.
    // TODO: Not really sure what's the value saving the settings instead of just the network name in persistent store
    // TODO: I guess if we are going to allow them to enter custom values in the future it makes sense.
    network.dex_hash = defaultForNetwork.dex_hash;
    network.aph_hash = defaultForNetwork.aph_hash;
    network.websocketUri = defaultForNetwork.websocketUri;
    network.kycUrl = defaultForNetwork.kycUrl;

    return this;
  },

  normalizeAndStore(network) {
    this.normalize(network);
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
