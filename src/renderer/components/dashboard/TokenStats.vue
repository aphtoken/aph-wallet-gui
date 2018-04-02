<template>
  <div class="token-stats" v-if="$store.state.statsToken">
    <div class="header">
      <h1 class="underlined">Token Stats</h1>
      <div class="current-value">
        <div class="label">Current Value</div>
        <div class="amount">{{ $formatMoney($store.state.statsToken.unitValue) }}</div>
      </div>
    </div>
    <div class="body">
      <aph-token-icon :symbol="$store.state.statsToken.symbol"></aph-token-icon>
      <div class="balance">
        <div class="name">{{ $store.state.statsToken.name }}</div>
        <div class="amount">
          {{ $formatNumber($store.state.statsToken.balance) }}<span class="currency">{{ $store.state.statsToken.symbol }}</span>
        </div>
        <div class="value">
          {{ $formatMoney($store.state.statsToken.totalValue) }}<span class="currency">USD</span>
        </div>
      </div>
      <div class="claim" v-if="$store.state.statsToken.symbol === 'NEO'">
        <div class="available">{{ $formatNumber($store.state.statsToken.availableToClaim) }} Gas Available</div>
        <div class="claim-btn" @click="claim">Claim</div>
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
  </div>
</template>

<script>
export default {
  methods: {
    claim() {
      if (_.isNull(this.wallet)) {
        return;
      }

      this.$services.neo.claimGas()
        .then(() => {

        })
        .catch((e) => {
          console.log(e);
        });
    },
  },
};
</script>

<style lang="scss">
.token-stats {
  @extend %tile-light;

  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    flex: none;
    padding: $space;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }

    .current-value {
      flex: none;
      text-align: right;

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
    padding: $space;

    .aph-token-icon {
      $width: toRem(150px);

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
      .name {
        color: $purple;
        font-family: GilroyMedium;
        font-size: toRem(23px);
        margin-bottom: $space;
      }

      .amount {
        font-family: GilroyMedium;
        font-size: toRem(38px);
        margin-bottom: $space;

        .currency {
          font-family: Gilroy;
          font-size: toRem(27px);
          margin-left: $space;
        }
      }

      .value {
        font-family: GilroyMedium;
        font-size: toRem(20px);

        .currency {
          margin-left: $space-xsm;
        }
      }
    }
    
    .claim {
      padding: $space-lg 0 0 $space-lg;
      font-family: Gilroy;
      font-size: toRem(20px);
      margin-bottom: $space;  
      
      .available {
        margin-bottom: $space-sm;
      }  
    }
    .claim-btn {
      @extend %btn-footer;
    }
  }

  .footer {
    display: flex;
    flex: none;
    padding: $space;

    > div {
      flex: none;

      & + div {
        margin-left: 10%;
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


