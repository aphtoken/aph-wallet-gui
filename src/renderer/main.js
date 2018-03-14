import Vue from 'vue';
import _ from 'lodash';
import axios from 'axios';

// Initial Vue Libraries
import App from './App';
import router from './router';
import store from './store';
import * as mixins from './mixins';

// Global Vue Components
import Icon from './components/Icon';
import Input from './components/Input';
import Select from './components/Select';

// Global Libraries
window._ = _;

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

// Register global mixins.
_.each(mixins, (mixin) => {
  Vue.mixin(mixin);
});

// Register global components.
Vue.component('aph-icon', Icon);
Vue.component('aph-select', Select);
Vue.component('aph-input', Input);

/* eslint-disable no-new */
new Vue({
  router,
  store,
  ...App,
}).$mount('#app');
