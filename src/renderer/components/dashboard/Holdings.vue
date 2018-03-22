<template>
  <div class="holdings">
    <div class="header">
      <h1 class="underlined">My holdings</h1>
    </div>
    <div class="body">
      <div v-for="(holding, index) in holdings" :class="['holding', {active: isActive(holding)}]" :key="index">
        <token-icon :symbol="holding.symbol"></token-icon>
        <div class="token">
          <div class="name">{{ holding.name }}</div>
          <div class="currency">{{ holding.symbol }}</div>
        </div>
        <div class="balance">
          <div class="amount">
            {{ formatBalance(holding) }}<span class="currency">{{ holding.symbol }}</span>
          </div>
          <div :class="['change', {decrease: holding.change < 0, increase: holding.change > 1}]">{{ formatChange(holding) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      holdings: [
        {
          balance: 211414,
          change: 2.77,
          name: 'Aphelion',
          symbol: 'APH',
        },
        {
          balance: 324,
          change: -0.43,
          name: 'Neo',
          symbol: 'NEO',
        },
        {
          balance: 5.4,
          change: 1.46,
          name: 'Gas',
          symbol: 'GAS',
        },
        {
          balance: 5.4,
          change: 1.46,
          name: 'Tron',
          symbol: 'TRX',
        },
      ],
    };
  },

  methods: {
    formatBalance({ balance }) {
      return this.$accounting.formatNumber(balance, 2);
    },

    formatChange({ change }) {
      return this.$accounting.formatNumber(change, 2);
    },

    isActive({ symbol }) {
      // This is just placeholder logic for now..
      return symbol === 'APH';
    },
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

