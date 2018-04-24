<template>
  <section id="dashboard--token-stats" v-if="$store.state.statsToken">
    <div class="header">
      <h1 class="underlined">Token Stats</h1>
      <div class="gas" v-if="$store.state.statsToken.availableToClaim">
        <div class="label">{{ $formatNumber($store.state.statsToken.availableToClaim) }} Gas</div>
        <div class="claiming" v-if="$isPending('claimGas')">Claiming Gas...</div>
        <a href="" class="claim" @click.prevent="claim" v-else>Claim Gas</a>
      </div>
      <div class="current-value">
        <div class="label">Current Value</div>
        <div class="amount">{{ $formatMoney($store.state.statsToken.unitValue) }}</div>
      </div>
    </div>
    <div class="body">
      <aph-token-icon :symbol="$store.state.statsToken.symbol"></aph-token-icon>
      <div :class="balanceClass">
        <div class="name">{{ $store.state.statsToken.name }}</div>
        <div class="amount">{{ formattedAmount }}<span class="currency">{{ $store.state.statsToken.symbol }}</span></div>
        <div class="value">{{ $formatMoney($store.state.statsToken.totalValue, null, `${$store.state.currencySymbol }0.00`) }}<span class="currency">{{ $store.state.currency }}</span></div>
      </div>
    </div>
    <div class="footer">
      <div class="total-supply">
        <div class="label">Total Supply</div>
        <div class="amount">{{ $formatNumber($store.state.statsToken.totalSupply) }}</div>
      </div>
      <div class="market-cap">
        <div class="label">Market Cap</div>
        <div class="amount">{{ $formatMoney($store.state.statsToken.marketCap) }}</div>
      </div>
      <div class="change">
        <div class="label">24h Change</div>
        <div :class="['amount', {increase: $store.state.statsToken.change24hrPercent > 0, decrease: $store.state.statsToken.change24hrPercent < 0}]">{{ $formatNumber($store.state.statsToken.change24hrPercent) }}</div>
      </div>
    </div>
  </section>
</template>

<script>
const AMOUNT_LENGTH_LIMIT = 15;

export default {
  computed: {
    balanceClass() {
      return this.formattedAmount.length > AMOUNT_LENGTH_LIMIT ? ['balance', 'small'] : ['balance'];
    },

    buttonLabel() {
      return this.$isPending('claimGas') ? 'Claiming...' : 'Claim';
    },

    formattedAmount() {
      return this.$formatNumber(this.$store.state.statsToken.balance);
    },
  },

  methods: {
    claim() {
      this.$store.dispatch('claimGas');
    },
  },
};
</script>

<style lang="scss">
#dashboard--token-stats {
  @extend %tile-light;

  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    flex: none;
    padding: $space-lg;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
      white-space: nowrap;
    }

    .gas {
      flex: 2;
      text-align: center;

      .claim, .claiming {
        font-family: GilroyMedium;
      }
    }

    .current-value {
      flex: 1;
      text-align: right;
      white-space: nowrap;

      .amount {
        color: $purple;

        font-family: GilroyMedium;
      }
    }
  }

  .body {
    align-items: center;
    display: flex;
    flex: 1;
    padding: 0 $space-lg;
    position: relative;

    .aph-token-icon {
      $width: toRem(125px);

      padding: 0 $space-lg 0 0;

      img, .placeholder {
        height: $width;
        width: $width;
      }

      .placeholder {
        font-size: toRem(30px);
      }
    }

    .balance {
      flex: none;

      .name {
        color: $purple;
        font-family: GilroyMedium;
        font-size: toRem(23px);
        margin-bottom: $space;
      }

      .amount {
        font-family: GilroyMedium;
        font-size: toRem(32px);
        margin-bottom: $space;

        .currency {
          font-family: Gilroy;
          font-size: toRem(20px);
          margin-left: $space-sm;
        }
      }

      .value {
        font-family: GilroyMedium;
        font-size: toRem(20px);

        .currency {
          margin-left: $space-xsm;
        }
      }

      &.small {
        .amount {
          font-size: toRem(22px);

          .currency {
            font-size: toRem(16px);
          }
        }
      }

      .value {
        font-size: toRem(16px);
      }
    }

    .claim {
      flex: 1;
      margin-left: $space-lg;
      font-family: Gilroy;
      font-size: toRem(20px);

      .available {
        @extend %small-uppercase-grey-label;

        margin-bottom: $space-sm;
        max-width: 15rem;
        text-align: center;
      }
    }
    .claim-btn {
      @extend %btn;
    }
  }

  .footer {
    display: flex;
    flex: none;
    padding: $space-lg;

    > div {
      flex: none;

      & + div {
        margin-left: $space-lg;
      }

      &.total-supply {
        min-width: toRem(125px);
      }
    }

    .amount {
      font-family: GilroySemibold;
      font-size: toRem(18px);
    }

    .change {
      .amount {
        font-family: GilroyMedium;

        &:after {
          content: "%";
        }

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

  .label {
    @extend %small-uppercase-grey-label;

    margin-bottom: $space-sm;
  }
}
</style>


