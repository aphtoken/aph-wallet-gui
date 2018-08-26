import Vue from 'vue';
import VueI18n from 'vue-i18n';
import _ from 'lodash';
import { mount, shallowMount } from '@vue/test-utils';

import * as mixins from '@/mixins';
import router from '@/router';

Vue.use(VueI18n);

_.each(mixins, (mixin) => {
  Vue.mixin(mixin);
});

Vue.component('aph-icon', require('@/components/Icon.vue'));

const getDefaultOpts = () => {
  return { router };
};

export default {
  getI18n(messages = {}) {
    return new VueI18n({
      fallbackLocale: 'en',
      locale: 'en',
      messages,
    });
  },

  mount(component, opts) {
    return mount(component, _.merge(getDefaultOpts(), opts));
  },

  shallow(component, opts) {
    return shallowMount(component, _.merge(getDefaultOpts(), opts));
  },
};
