<template>
  <section id="portfolio-header">
    <simple-donut :percent="$store.state.portfolio.changePercent"></simple-donut>
    <div class="ticker">
      <h1 class="underlined">My Porfolio</h1>
      <div class="balance">
        <span class="symbol">$</span><span class="amount">{{ $formatNumberShort($store.state.portfolio.balance) }}</span><span class="currency">USD</span>
      </div>
      <div class="change">
        <div class="label">24h change</div>
        <div :class="['amount', {increase: $store.state.portfolio.changeUsd > 0, decrease: $store.state.portfolio.changeUsd < 0}]">{{ $formatMoney($store.state.portfolio.changeUsd, '0,0[.]0') }}</div>
      </div>
    </div>
    <div class="btn-group">
      <div class="receive-btn" @click="showSendAddressModal">
        <aph-icon name="receive"></aph-icon>
        <p>Receive</p>
      </div>
      <router-link class="send-btn" to="/authenticated/dashboard/send">
        <aph-icon name="send"></aph-icon>
        <p>Send</p>
      </router-link>
    </div>
    <aph-address-modal v-if="this.$store.state.showSendAddressModal" :address="getCurrentWalletAddress()" :onDone="hideSendAddressModal"></aph-address-modal>
  </section>
</template>

<script>
import SimpleDonut from './charts/SimpleDonut';
let loadHoldingsIntervalId;

export default {
  components: {
    SimpleDonut,
  },

  data() {
    return {
      portfolio: {
        balance: 0,
        changeUsd: 0,
        changePercent: 0,
      },
    };
  },

  methods: {
    getCurrentWalletAddress() {
      return this.$services.wallets.getCurrentWallet().address;
    },

    hideSendAddressModal() {
      this.$store.commit('setShowSendAddressModal', false);
    },

    loadHoldings() {
      this.$store.dispatch('fetchPortfolio');
    },

    showSendAddressModal() {
      this.$store.commit('setShowSendAddressModal', true);
    },
  },

  mounted() {
    this.loadHoldings();

    loadHoldingsIntervalId = setInterval(() => {
      this.loadHoldings();
    }, this.$constants.intervals.POLLING);
  },

  beforeDestroy() {
    clearInterval(loadHoldingsIntervalId);
  },
};
</script>

<style lang="scss">
h1.underlined {
  @extend %underlined-header;
}

#portfolio-header {
  display: flex;
  flex-direction: row;
  padding: $space-lg $space-lg 0;
  align-items: center;

  .simple-donut {
    margin: 0 $space-xl 0 0;
    height: toRem(200px);
  }

  .btn-group {
    display: flex;
    flex-direction: row;
    flex: none;
  }

  .ticker {
    flex: 1;

    .balance {
      .amount {
        font-size: toRem(45px);
        margin: 0 $space 0 $space-sm;
      }

      .currency, .symbol {
        font-size: toRem(30px);
      }
    }

    .change {
      align-items: center;
      display: flex;
      margin-top: $space;

      .label {
        @extend %small-uppercase-grey-label;
      }

      .amount {
        font-size: toRem(16px);
        margin-left: $space;

        &.increase {
          color: $green;

          &:before {
            content: "+";
            }
        }

        &.decrease {
          color: $red;
        }
      }
    }
  }

  .receive-btn, .send-btn {
    @extend %btn-square;

    box-shadow: $box-shadow;
    height: $space * 9;

    .aph-icon {
      .fill {
        fill: $dark;
      }
    }
  }

  .receive-btn {
    .aph-icon {
      .stroke {
        stroke: $dark !important;
      }
    }
  }

  .send-btn {
    background: $purple;
    margin-left: $space;

    p {
      color: white;
    }

    .aph-icon {
      .stroke {
        stroke: $dark !important;
      }
    }
  }
}
</style>


