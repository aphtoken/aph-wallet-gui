import { mapGetters, mapMutations } from 'vuex';

import {
  getters,
  mutations,
} from '../store';

export default {
  computed: mapGetters(
    _.map(getters, (obj, name) => {
      return name;
    })
  ),

  methods: mapMutations(
    _.map(mutations, (obj, name) => {
        return name;
    })
  ),
};
