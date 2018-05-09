import './error-handler';
import './libraries';
import * as mixins from './mixins';
import {
  contacts,
  network,
  settings,
  storage,
  wallets,
} from './services';
import App from './App';
import CopyText from './components/CopyText';
import DatePicker from './components/DatePicker';
import DomPortal from 'vue-dom-portal';
import Holding from './components/Holding';
import Icon from './components/Icon';
import Input from './components/Input';
import Select from './components/Select';
import SimpleTransactions from './components/SimpleTransactions';
import TimestampFromNow from './components/TimestampFromNow';
import TokenIcon from './components/TokenIcon';
import Vue from 'vue';
import VueFlashMessage from 'vue-flash-message';
import VueHighCharts from 'vue-highcharts';
import _ from 'lodash';
import accounting from 'accounting';
import axios from 'axios';
import moment from 'moment';
import router from './router';
import { store } from './store';

// Global Libraries.
window._ = _;
window.accounting = accounting;
window.axios = axios;
window.moment = moment;

// Setup Vue.
if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

// Vue Plugins.
Vue.use(VueHighCharts);
Vue.use(VueFlashMessage);
Vue.use(DomPortal);
require('vue-flash-message/dist/vue-flash-message.min.css');

// Register global mixins.
_.each(mixins, (mixin) => {
  Vue.mixin(mixin);
});

// Register global components.
Vue.component('aph-copy-text', CopyText);
Vue.component('aph-date-picker', DatePicker);
Vue.component('aph-holding', Holding);
Vue.component('aph-icon', Icon);
Vue.component('aph-input', Input);
Vue.component('aph-select', Select);
Vue.component('aph-simple-transactions', SimpleTransactions);
Vue.component('aph-timestamp-from-now', TimestampFromNow);
Vue.component('aph-token-icon', TokenIcon);

// Sync local storage to store.
storage.init();
contacts.sync();
network.init();
settings.sync();
wallets.sync();

/* eslint-disable no-new */
new Vue({
  router,
  store,
  ...App,
}).$mount('#app');
