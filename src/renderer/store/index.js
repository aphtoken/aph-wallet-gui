import Vue from 'vue';
import Vuex from 'vuex';
import * as actions from './actions';
import * as getters from './getters';
import * as mutations from './mutations';

Vue.use(Vuex);

const state = {
  activeRecentTransaction: null,
  activeTransactionHash: null,
  activeTransactionToken: null,
  holdings: [],
  recentTransactions: [],
  showAddTokenModal: false,
  showSendAddressModal: false,
  showPriceTile: true,
  statsToken: null,
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
