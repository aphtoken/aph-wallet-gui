import Vue from 'vue';
import VueHighCharts from 'vue-highcharts';
import _ from 'lodash';
import axios from 'axios';
import accounting from 'accounting';
import moment from 'moment';
import VueFlashMessage from 'vue-flash-message';

// Services.
import { contacts, settings, wallets } from './services';

// Initial Vue Libraries.
import './libraries';
import * as mixins from './mixins';
import App from './App';
import router from './router';
import { store } from './store';

// Global Vue Components.
import CopyText from './components/CopyText';
import DatePicker from './components/DatePicker';
import Icon from './components/Icon';
import Input from './components/Input';
import Select from './components/Select';
import SimpleTransactions from './components/SimpleTransactions';
import TimestampFromNow from './components/TimestampFromNow';
import TokenIcon from './components/TokenIcon';

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
require('vue-flash-message/dist/vue-flash-message.min.css');

// Register global mixins.
_.each(mixins, (mixin) => {
  Vue.mixin(mixin);
});

// Register global components.
Vue.component('aph-copy-text', CopyText);
Vue.component('aph-date-picker', DatePicker);
Vue.component('aph-icon', Icon);
Vue.component('aph-input', Input);
Vue.component('aph-select', Select);
Vue.component('aph-simple-transactions', SimpleTransactions);
Vue.component('aph-timestamp-from-now', TimestampFromNow);
Vue.component('aph-token-icon', TokenIcon);

// Sync local storage to store.
contacts.sync();
settings.sync();
wallets.sync();

/* eslint-disable no-new */
new Vue({
  router,
  store,
  ...App,
}).$mount('#app');
