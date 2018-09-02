<template>
  <section id="dashboard--holdings">
    <div class="header">
      <h1 class="underlined">{{$t('myHoldings')}}</h1>
    </div>
    <div class="body">
      <aph-holding v-for="(holding, index) in holdings" :holding="holding" :on-click="viewHoldingDetail" :class="[{active: isActive(holding)}]" :key="index"></aph-holding>
    </div>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    holdings() {
      return this.$store.state.holdings.filter(({ name, symbol }) => {
        return !!name && !!symbol;
      }).map((holding) => {
        // Note: this must clone the holding or it will modify the holding without using store mutations and cause
        //       side effects. Saved data now has canRemove saved in cache in some wallet's db cache since this wasn't
        //       previously doing a deep clone in assets/AssetTable.vue; so we have to explicitly set it false here
        return _.merge(_.cloneDeep(holding), {
          canRemove: false,
        });
      });
    },

    ...mapGetters([
      'sendInProgress',
    ]),
  },

  methods: {
    isActive({ assetId }) {
      return _.get(this.$store.state.statsToken, 'assetId') === assetId;
    },

    viewHoldingDetail(holding) {
      if (this.sendInProgress) {
        return;
      }

      this.$router.replace('/authenticated/dashboard');
      this.$store.commit('setStatsToken', holding);
    },
  },
};
</script>

<style lang="scss">
#dashboard--holdings {
  display: flex;
  flex-direction: column;

  .header {
    padding: $space-lg;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    overflow: auto;
    padding-right: $space;
  }
}
</style>
