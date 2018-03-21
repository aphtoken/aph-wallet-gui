/* eslint-disable no-use-before-define */
// import Vue from 'vue';
// import { store } from './index';

export {
  clearActiveTransactionHash,
  setActiveTransactionHash,
};

function clearActiveTransactionHash(state) {
  state.activeTransactionHash = null;
}

function setActiveTransactionHash(state, activeTransactionHash) {
  state.activeTransactionHash = activeTransactionHash;
}
