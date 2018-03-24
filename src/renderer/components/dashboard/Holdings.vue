<template>
  <div class="holdings">
    <div class="header">
      <h1 class="underlined">My holdings</h1>
    </div>
    <div class="body">
      <div v-for="(holding, index) in $store.state.holdings" :class="['holding', {active: isActive(holding)}]" :key="index">
        <token-icon :symbol="holding.symbol"></token-icon>
        <div class="token">
          <div class="name">{{ holding.name }}</div>
          <div class="currency">{{ holding.symbol }}</div>
        </div>
        <div class="balance">
          <div class="amount">
            {{ $formatNumber(holding.balance) }}<span class="currency">{{ holding.symbol }}</span>
          </div>
          <div :class="['change', {decrease: holding.change24hrPercent < 0, increase: holding.change24hrPercent > 1}]">{{ $formatNumber(holding.change24hrPercent) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    isActive({ symbol }) {
      // This is just placeholder logic for now..
      return symbol === 'APH';
    },

    loadHoldings() {
      if (!this.$services.wallets.getCurrentWallet()) {
        return;
      }

      this.$services.neo
        .fetchHoldings(this.$services.wallets.getCurrentWallet().address)
        .then((data) => {
          this.$store.commit('setHoldings', data);
        })
        .catch(() => {
        });
    },
  },

  mounted() {
    this.loadHoldings();
  },
};
</script>

<style lang="scss">
.holdings {
  display: flex;
  flex-direction: column;

  .header {
    padding: $space;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    overflow: auto;

    .holding {
      align-items: center;
      background: white;
      border-left: 3px solid transparent;
      border-radius: $border-radius;
      cursor: pointer;
      display: flex;
      padding: $space;

      .token-icon {
        flex: none;
        padding-right: $space;
      }

      .token {
        flex: 1;

        .name {
          font-family: GilroySemibold;
          font-size: toRem(18px);
          margin-bottom: $space-sm;
        }

        .currency {
          @extend %small-uppercase-grey-label;

          font-size: toRem(12px);
        }
      }

      .balance {
        flex: 1;
        font-family: GilroyMedium;
        text-align: right;

        .amount {
          margin-bottom: $space-sm;
          font-size: toRem(18px);

          .currency {
            margin-left: $space-xsm;
          }
        }

        .change {
          font-size: toRem(15px);

          &.increase {
            color: $green;

            &:before {
              content: "+";
            }

            &:after {
              content: "%";
              margin-left: $space-xsm;
            }
          }

          &.decrease {
            color: $red;
          }

          &:after {
            content: "%";
            margin-left: $space-xsm;
          }
        }
      }

      &:hover, &.active {
        border-color: $purple;
      }

      & + .holding {
        margin-top: $space;
      }
    }
  }
}
</style>

