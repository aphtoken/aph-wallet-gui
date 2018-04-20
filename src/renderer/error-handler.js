import Vue from 'vue';

const prev = Vue.config.errorHandler;
const handler = (err, vm, info) => {
  if (typeof prev === 'function') {
    prev.call(this, err, vm, info);
  }
};

Vue.config.errorHandler = handler;
