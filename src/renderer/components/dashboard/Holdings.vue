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
      });
    },

    ...mapGetters({
      sendInProgress: 'sendInProgress',
    }),
  },

  methods: {
    isActive({ symbol }) {
      return _.get(this.$store.state.statsToken, 'symbol') === symbol;
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

