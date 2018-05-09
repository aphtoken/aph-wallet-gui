import * as services from '../services';
import _ from 'lodash';

const $services = {};

_.each(services, (service, name) => {
  $services[name] = service;
});

export default {
  created() {
    this.$services = $services;
  },
};
