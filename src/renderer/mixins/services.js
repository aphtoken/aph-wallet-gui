import _ from 'lodash';
import lockr from 'lockr';
import * as services from '../services';

const $services = {};

_.each(services, (service, name) => {
  $services[name] = service;
});

// Third party
$services.lockr = lockr;

export default {
  created() {
    this.$services = $services;
  },
};
