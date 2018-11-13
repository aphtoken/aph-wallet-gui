import DomPortal from 'vue-dom-portal';
import Vue from 'vue';
import VueFlashMessage from 'vue-flash-message';
import VueI18n from 'vue-i18n';
import VueHighCharts from 'vue-highcharts';
import VueNativeSock from 'vue-native-websocket';
import _ from 'lodash';
import accounting from 'accounting';
import axios from 'axios';
import moment from 'moment';

// Services, etc.
import { contacts, network, settings, storage, wallets } from '@/services';

// constants
import { messages } from '@/constants';

// Initial Vue Libraries.
import '@/error-handler';
import '@/libraries';
import '@/decorators';
import * as mixins from '@/mixins';
import App from '@/App';
import router from '@/router';
import { store } from '@/store';

// Global Vue Components.
import CopyText from '@/components/CopyText';
import DatePicker from '@/components/DatePicker';
import DexInput from '@/components/DexInput';
import Form from '@/components/Form';
import Holding from '@/components/Holding';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import Select from '@/components/Select';
import SimpleTransactions from '@/components/SimpleTransactions';
import TimestampFromNow from '@/components/TimestampFromNow';
import TokenIcon from '@/components/TokenIcon';
import SpinnerWrapper from '@/components/SpinnerWrapper';

// Global Libraries.
window._ = _;
window.accounting = accounting;
window.axios = axios;
window.moment = moment;
window.TradingView = require('../../static/charting_library/charting_library.min').TradingView;

// Setup Vue.
if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

// Vue Plugins.
Vue.use(DomPortal);
Vue.use(VueFlashMessage);
Vue.use(VueHighCharts);
Vue.use(VueI18n);
require('vue-flash-message/dist/vue-flash-message.min.css');

Vue.use(VueNativeSock, network.getSelectedNetwork().websocketUri, {
  connectManually: true,
  format: 'json',
  reconnection: true,
  reconnectionDelay: 3000,
  store,
});

// Register global mixins.
_.each(mixins, (mixin) => {
  Vue.mixin(mixin);
});

// Register global components.
Vue.component('aph-copy-text', CopyText);
Vue.component('aph-date-picker', DatePicker);
Vue.component('aph-dex-input', DexInput);
Vue.component('aph-form', Form);
Vue.component('aph-holding', Holding);
Vue.component('aph-icon', Icon);
Vue.component('aph-input', Input);
Vue.component('aph-select', Select);
Vue.component('aph-simple-transactions', SimpleTransactions);
Vue.component('aph-timestamp-from-now', TimestampFromNow);
Vue.component('aph-token-icon', TokenIcon);
Vue.component('aph-spinner-wrapper', SpinnerWrapper);

// Sync local storage to store.
storage.init();
contacts.sync();
network.init();
settings.sync();
wallets.sync();

// get user's locale settings
const language = localStorage.getItem('language') ||
  (window.navigator.userLanguage ||
    window.navigator.language).split('-')[0];

// Create VueI18n instance with options
const i18n = new VueI18n({
  locale: language,
  fallbackLocale: 'en',
  messages,
});

/* eslint-disable no-new */
new Vue({
  router,
  store,
  i18n,
  ...App,
}).$mount('#app');
