import Vue from 'vue';
import _ from 'lodash';

import * as services from '../services';

const $services = {};

_.each(services, (service, name) => {
  $services[name] = service;
});

Vue.prototype.$services = $services;
