import lockr from 'lockr';
import _ from 'lodash';

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

export default {

  getNetworks() {
    return _.sortBy(NETWORKS, 'label');
  },

  getSelectedNetwork() {
    return lockr.get(NETWORK_STORAGE_KEY, _.first(NETWORKS).value);
  },

  setSelectedNetwork(network) {
    lockr.set(NETWORK_STORAGE_KEY, network);

    return this;
  },

};
