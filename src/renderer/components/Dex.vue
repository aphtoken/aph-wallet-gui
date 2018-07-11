<template>
  <section id="dex">
    <div class="grid" v-if="connected">
      <div class="grid--column column-left">
        <div class="grid--cell top-left">
          <router-view name="top-left"></router-view>
        </div>
        <div class="grid--cell bottom-left">
          <router-view name="bottom-left"></router-view>
        </div>
      </div>
      <div class="grid--column column-middle">
        <div class="grid--cell top-middle">
          <router-view name="top-middle"></router-view>
        </div>
        <div class="grid--cell bottom-middle">
          <router-view name="bottom-middle"></router-view>
        </div>
      </div>
      <div class="grid--column column-right">
        <div class="grid--cell top-right">
          <router-view name="top-right"></router-view>
        </div>
        <div class="grid--cell bottom-right">
          <router-view name="bottom-right"></router-view>
        </div>
      </div>
    </div>
    <div v-else class="zero-state">
          <aph-icon name="no-transactions"></aph-icon>
          <div class="label">Unable to reach trading server.</div>
    </div>
    <dex-demo-confirmation v-if="!$store.state.acceptDexDemoVersion && !isOutOfDate"></dex-demo-confirmation>
    <dex-out-of-date v-if="isOutOfDate && !this.$store.state.acceptDexOutOfDate"></dex-out-of-date>
  </section>
</template>

<script>
import DexDemoConfirmation from './modals/DexDemoConfirmation';
import DexOutOfDate from './modals/DexOutOfDate';

export default {
  beforeDestroy() {
    this.$store.state.showPortfolioHeader = true;
    clearInterval(this.interval);
  },

  components: {
    DexDemoConfirmation,
    DexOutOfDate,
  },

  created() {
    this.setConnected();
    this.interval = setInterval(() => {
      this.setConnected();
    }, 1000);
  },

  data() {
    return {
      connected: false,
    };
  },

  computed: {
    isOutOfDate() {
      return this.$store.state.latestVersion
        && this.$store.state.latestVersion.testExchangeScriptHash.replace('0x', '')
          !== this.$constants.assets.DEX_SCRIPT_HASH;
    },
  },

  methods: {
    setConnected() {
      if (!this.$store.state.socket || this.$store.state.socket.isConnected !== true) {
        if (moment().utc().diff(this.$store.state.socket.connectionClosed, 'milliseconds')
          > this.$constants.timeouts.WEBSOCKET_CONNECTION) {
          this.connected = false;
          return;
        }
      }

      if (this.$store.state.currentMarket) {
        if (!this.$store.state.socket.subscribedMarket
          || this.$store.state.socket.subscribedMarket !== this.$store.state.currentMarket.marketName) {
          this.$store.dispatch('subscribeToMarket', {
            market: this.$store.state.currentMarket,
          });
        }
      }

      this.connected = true;
    },
  },

  mounted() {
    this.$store.state.showPortfolioHeader = false;
    this.$store.dispatch('fetchMarkets', {
      done: () => {
        if (!this.$store.state.currentMarket) {
          this.$store.commit('setCurrentMarket', this.$store.state.markets[0]);
        }
      },
    });

    this.$services.dex.completeSystemAssetWithdrawals();

    this.$store.state.socket.opened = () => {
      if (this.$store.state.currentMarket) {
        this.$store.dispatch('subscribeToMarket', {
          market: this.$store.state.currentMarket,
        });
      }
    };

    this.$store.state.socket.orderCreated = (message) => {
      /* eslint-disable max-len */
      this.$services.alerts.success(`${(message.side === 'bid' ? 'Buy' : 'Sell')} Order Created. x${message.data.quantity} @${message.data.price}`);
    };

    this.$store.state.socket.orderMatched = (message) => {
      /* eslint-disable max-len */
      this.$services.alerts.success(`${(message.side === 'bid' ? 'Buy' : 'Sell')} Order Filled. x${message.data.quantity} @${message.data.price}`);
    };
  },
};
</script>

<style lang="scss">
#dex {
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-direction: column;
  justify-content: center;
  padding-top: toRem(30px);
  width: 100%;
  flex: 1;

  .grid {
    display: flex;
    flex-direction: row;
    flex: 1;
    height: 100%;
    padding: $space;
    width: 100%;
  }

  .grid--column {
    display: flex;
    flex-direction: column;

    &.column-left {
      flex: 1;
    }

    &.column-middle {
      flex: 3;
    }

    &.column-right {
      flex: 1;
    }

    .grid--cell {
      flex-direction: row;
      flex: 1;
      display: flex;
      flex-direction: column;

      > * {
        flex: 1;
      }

      &.top-right {
        flex: 2;
      }

      &.bottom-right {
        flex: 1;
      }

      &.top-left {
        flex: none;
      }

      &.bottom-left {
        flex: 1;
      }

      &.bottom-middle {
        flex: 1;
      }

      &.top-middle {
        flex: none;
      }

      & + .grid--cell {
        margin-top: $space;
      }
    }

    & + .grid--column {
      margin-left: $space;
    }
  }

  > .zero-state {
      @extend %tile-light;

      align-items: center;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: center;

      .aph-icon {
        svg {
          height: toRem(52px);

          .fill {
            fill: $purple;
          }
        }
      }

      .label {
        color: $purple;
        font-weight: GilroyMedium;
        margin-top: $space-lg;
      }
    }

}
</style>
