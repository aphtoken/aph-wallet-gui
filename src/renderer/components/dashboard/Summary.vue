<template>
  <div id="dashboard--summary">
    <div class="header">
      <div class="left">
        <div class="label">My Holdings ({{ $store.state.statsToken.symbol }})</div>
        <div class="balance">
          <div class="count">{{ $formatNumber($store.state.statsToken.balance) }}</div>
          <div class="symbol">{{ $store.state.statsToken.symbol }}</div>
        </div>
        <div class="value">{{ $formatMoney($store.state.statsToken.unitValue * $store.state.statsToken.balance) }}</div>
      </div>
      <div class="right">
        <aph-token-icon :symbol="$store.state.statsToken.symbol"></aph-token-icon>
      </div>
    </div>
    <div class="body">
      <div class="row">
        <div class="flex-2 token">
          <div class="name">{{ $store.state.statsToken.name }}</div>
          <div class="symbol">{{ $store.state.statsToken.symbol }}</div>
        </div>
        <div class="flex-none">
          <a :href="`https://coinmarketcap.com/currencies/${$store.state.statsToken.name}/`" class="visit-cmc-btn" target="_blank">
            <img src="@/assets/img/cmc.svg" alt="">
          </a>
        </div>
      </div>
      <div class="row">
        <div class="flex-2 current-price">
          <div class="label">{{ $t('currentPrice') }}</div>
          <div class="value">
            <div class="money">{{ $formatMoney($store.state.statsToken.unitValue) }}</div>
            <div class="symbol">{{ $store.state.currency }}</div>
          </div>
          <div class="change increase" :class="[{increase: $store.state.statsToken.change24hrPercent > 0, decrease: $store.state.statsToken.change24hrPercent < 0}]">
            ({{ $formatNumber($store.state.statsToken.change24hrPercent) }}%)
          </div>
        </div>
      </div>
      <div class="row">
        <div class="flex-2 market-cap">
          <div class="label">{{$t('marketCap')}}</div>
          <div class="value">
            <div class="money">{{ $formatMoneyWithoutCents($store.state.statsToken.marketCap) }}</div>
            <div class="symbol">{{ $store.state.currency }}</div>
          </div>
        </div>
        <!-- <div class="flex-2 market-cap-volume">
          <div class="label">Volume (24h)</div>
          <div class="value">
            <div class="money">$5,734</div>
            <div class="symbol">{{ $store.state.currency }}</div>
          </div>
        </div> -->
      </div>
      <div class="row">
        <div class="flex-2 circulating">
          <div class="label">Circulating Supply</div>
          <div class="value">
            <div class="count">{{ $formatNumber($store.state.statsToken.availableSupply) }}</div>
            <div class="symbol">{{ $store.state.statsToken.symbol }}</div>
          </div>
        </div>
        <div class="flex-2 circulating-volume">
          <div class="label">Volume (24h)</div>
          <div class="value">
            <div class="money">{{ $formatMoneyWithoutCents($store.state.statsToken.unitValue * volume) }}</div>
            <div class="symbol">{{ $store.state.statsToken.symbol }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  computed: {
    ...mapState(['statsToken']),
  },

  data() {
    return {
      volume: 0,
    };
  },

  methods: {
    loadPriceData() {
      if (!this.$store.state.statsToken) {
        return;
      }

      // eslint-disable-next-line
      this.$services.valuation.getHistorical(this.$store.state.statsToken.symbol, 24)
        .then((priceData) => {
          this.$set(this, 'volume', priceData.volume);
        })
        .catch((e) => {
          this.$services.alert.exception(e);
        });
    },
  },

  mounted() {
    this.loadPriceData();
  },

  watch: {
    statsToken: {
      deep: true,
      handler() {
        this.loadPriceData();
      },
    },
  },
};
</script>


<style lang="scss">
#dashboard--summary {
  border-radius: $border-radius;
  margin: $space;

  .header {
    background: $dark-purple;
    border-top-left-radius: $border-radius;
    border-top-right-radius: $border-radius;
    color: white;
    display: flex;
    padding: $space-lg;
    align-items: center;

    .left {
      flex: 1;

      .balance {
        display: flex;
        align-items: flex-end;
        line-height: 1;
        margin: $space 0;

        .count {
          font-size: toRem(30px);
          margin-right: $space-sm;
        }
      }
    }

    .right {
      flex: none;

      .aph-token-icon {
        img {
          height: 80px;
          width: 80px;
        }
      }
    }
  }

  .body {
    background: white;
    border-bottom-left-radius: $border-radius;
    border-bottom-right-radius: $border-radius;
    padding: $space-lg;

    .row {
      display: flex;
      align-items: center;

      .visit-cmc-btn {
        @extend %btn;

        font-size: 0;
        height: auto;
        padding: $space-sm $space;
        width: auto;
      }

      .token {
        flex: 1;
        width: auto;

        .name {
          font-size: toRem(32px);
          font-weight: bold;
        }

        .symbol {
          color: $dark-grey;
          font-size: toRem(20px);
          font-weight: bold;
          margin-top: $space-sm;
        }
      }

      .flex-2 {
        width: 66%
      }

      .flex-1 {
        width: 33%
      }

      .flex-none {
        flex: none;
      }

      .flex-2, .flex-1, .flex-none {
        font-weight: bold;
        margin-top: $space-sm;

        .label {
          color: $dark-grey;
          font-weight: bold;
        }

        .value {
          align-items: flex-end;
          display: flex;
          line-height: 1;
          margin: $space 0;

          .money, .count {
            @include truncate();

            font-size: toRem(30px);
            margin-right: $space-sm;
          }
        }
      }

      .current-price {
        .change {
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

      & + .row {
        margin-top: $space-lg;
      }
    }
  }
}
</style>
