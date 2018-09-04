import Vue from 'vue';
import VueI18n from 'vue-i18n';
import Vuex from 'vuex';
import _ from 'lodash';
import { mount, shallowMount } from '@vue/test-utils';

// Initial vue libraries
import '@/decorators';
import * as mixins from '@/mixins';
import router from '@/router';
import { actions, getters, mutations, state } from '@/store';
import { messages } from '@/constants';

Vue.use(VueI18n);

_.each(mixins, (mixin) => {
  Vue.mixin(mixin);
});

// Register global components.
Vue.component('aph-copy-text', require('@/components/CopyText.vue'));
Vue.component('aph-date-picker', require('@/components/DatePicker.vue'));
Vue.component('aph-dex-input', require('@/components/DexInput.vue'));
Vue.component('aph-form', require('@/components/Form.vue'));
Vue.component('aph-holding', require('@/components/Holding.vue'));
Vue.component('aph-icon', require('@/components/Icon.vue'));
Vue.component('aph-input', require('@/components/Input.vue'));
Vue.component('aph-select', require('@/components/Select.vue'));
Vue.component('aph-simple-transactions', require('@/components/SimpleTransactions.vue'));
Vue.component('aph-timestamp-from-now', require('@/components/TimestampFromNow.vue'));
Vue.component('aph-token-icon', require('@/components/TokenIcon.vue'));
Vue.component('aph-spinner-wrapper', require('@/components/SpinnerWrapper.vue'));

const getI18n = () => {
  return new VueI18n({
    fallbackLocale: 'en',
    locale: 'en',
    messages: {
      en: messages.en,
    },
  });
};

const getDefaultOpts = (customState) => {
  const store = new Vuex.Store({
    actions,
    getters,
    mutations,
    state: _.assign(state, customState),
  });

  return { i18n: getI18n(), router, store };
};

export default {
  mount(component, opts, customState) {
    return mount(component, _.merge(getDefaultOpts(customState), opts));
  },

  shallow(component, opts, customState) {
    return shallowMount(component, _.merge(getDefaultOpts(customState), opts));
  },
};
