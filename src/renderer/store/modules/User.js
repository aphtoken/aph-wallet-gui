const state = {
  //
};

const mutations = {
  /* eslint-disable no-unused-vars */
  SOME_SYNC_TASK(state) {
    //
  },
  /* eslint-eable no-unused-vars */
};

const actions = {
  someAsyncTask({ commit }) {
    // do something async
    commit('SOME_SYNC_TASK');
  },
};

export default {
  actions,
  mutations,
  namespaced: true,
  state,
};
