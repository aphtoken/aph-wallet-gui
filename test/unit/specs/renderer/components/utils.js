import * as mixins from '@/mixins';
import Vue from 'vue';
import _ from 'lodash';
import router from '@/router';
import { shallow } from '@vue/test-utils';

_.each(mixins, (mixin) => {
  Vue.mixin(mixin);
});

Vue.component('aph-icon', require('@/components/Icon.vue'));

const getDefaultOpts = () => {
  return { router };
};

export default {
  shallow(component, opts) {
    return shallow(component, _.merge(getDefaultOpts(), opts));
  },
};
