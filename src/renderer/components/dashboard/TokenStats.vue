<template>
  <section id="dashboard--token-stats" v-if="$store.state.statsToken">
    <div class="header">
      <h1 class="underlined">{{$t('tokenStats')}}</h1>
      <div class="current-value">
        <div class="label">{{$t('currentValue')}}</div>
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
        <div class="label">{{$t('availableSupply')}}</div>
        <div class="amount">{{ $formatNumber($store.state.statsToken.availableSupply) }}</div>
      </div>
      <div class="market-cap">
        <div class="label">{{$t('marketCap')}}</div>
        <div class="amount">{{ $formatMoneyWithoutCents($store.state.statsToken.marketCap) }}</div>
      </div>
      <div class="change">
        <div class="label">{{$t('twentyFourHourChange')}}</div>
        <div :class="['amount', {increase: $store.state.statsToken.change24hrPercent > 0, decrease: $store.state.statsToken.change24hrPercent < 0}]">{{ $formatNumber($store.state.statsToken.change24hrPercent) }}</div>
      </div>
    </div>
  </section>
</template>

<script>
import ClaimGasButton from './ClaimGasButton';

const AMOUNT_LENGTH_LIMIT = 15;

export default {
  components: {
    ClaimGasButton,
  },

  computed: {
    balanceClass() {
      return this.formattedAmount.length > AMOUNT_LENGTH_LIMIT ? ['balance', 'small'] : ['balance'];
    },

    formattedAmount() {
      if (!this.$store.state.statsToken) {
        return '0';
      }
      return this.$formatNumber(this.$store.state.statsToken.balance);
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

    .current-value {
      flex: 1;
      text-align: right;
      white-space: nowrap;

      .amount {
        color: $purple;
        font-size: toRem(20px);
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
      $iconSize: toRem(135px);

      padding: 0 $space-lg 0 0;

      img, .placeholder {
        height: $iconSize;
        width: $iconSize;
      }

      .placeholder-text {
        font-size: toRem(30px);
        top: toRem(4px);
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
        color: $darker-grey;
        font-family: GilroyMedium;
        font-size: toRem(16px);

        .currency {
          margin-left: $space-xs;
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
    }

    @include lowRes() {
      .aph-token-icon {
        $iconSize: toRem(110px);

        img, .placeholder {
          height: $iconSize;
          width: $iconSize;
        }
      }

      .balance {
        .name, .amount {
          margin-bottom: $space-xs;
        }

        .amount {
          font-size: toRem(28px);

          .currency {
            font-size: toRem(16px);
          }
        }
      }
    }
  }

  .footer {
    display: flex;
    flex: none;
    padding: $space-lg;

    > div {
      flex: 1;

      &.total-supply {
        min-width: toRem(125px);
      }
    }

    .amount {
      font-family: GilroyMedium;
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


