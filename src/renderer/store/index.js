import Vue from 'vue';
import Vuex from 'vuex';
import * as getters from './getters';
import * as mutations from './mutations';

Vue.use(Vuex);

const state = {
  activeRecentTransaction: null,
  holdings: [],
  recentTransactions: [],
  statsToken: null,
};

const store = new Vuex.Store({
  getters,
  mutations,
  state,
});

export {
  getters,
  mutations,
  state,
  store,
};
