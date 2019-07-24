import Vue from 'vue';
import _ from 'lodash';

const prev = Vue.config.errorHandler;
const handler = (err, vm, info) => {
  // Do stuff here...

  if (_.isFunction(prev)) {
    prev.call(this, err, vm, info);
  }
};

Vue.config.errorHandler = handler;
