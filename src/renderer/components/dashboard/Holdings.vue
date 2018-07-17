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
let loadHoldingsIntervalId;
export default {
  computed: {
    holdings() {
      return this.$store.state.holdings.filter(({ name, symbol }) => {
        return !!name && !!symbol;
      });
    },
  },

  methods: {
    isActive({ symbol }) {
      return _.get(this.$store.state.statsToken, 'symbol') === symbol;
    },

    loadHoldings() {
      this.$store.dispatch('fetchHoldings', { done: null });
    },

    viewHoldingDetail(holding) {
      if (this.$store.state.sendInProgress === true) {
        return;
      }

      this.$router.replace('/authenticated/dashboard');
      this.$store.commit('setStatsToken', holding);
    },
  },

  mounted() {
    this.loadHoldings();

    loadHoldingsIntervalId = setInterval(() => {
      this.loadHoldings();
    }, this.$constants.intervals.HOLDINGS_POLLING);
  },

  beforeDestroy() {
    clearInterval(loadHoldingsIntervalId);
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

