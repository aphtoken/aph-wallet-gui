<template>
  <section id="portfolio-header">
    <simple-donut :percent="portfolio.changePercent"></simple-donut>
    <div class="ticker">
      <h1 class="underlined">My Porfolio</h1>
      <div class="balance">
        <span class="symbol">$</span><span class="amount">{{ $formatNumber(portfolio.balance) }}</span><span class="currency">USD</span>
      </div>
      <div class="change">
        <div class="label">24h change</div>
        <div class="amount increase">{{ $formatMoney(portfolio.changeUsd) }}</div>
      </div>
    </div>
    <div class="btn-group">
      <div class="receive-btn">
        <aph-icon name="receive"></aph-icon>
        <p>Receive</p>
      </div>
      <div class="send-btn">
        <aph-icon name="send"></aph-icon>
        <p>Send</p>
      </div>
    </div>
  </section>
</template>

<script>
import SimpleDonut from './charts/SimpleDonut';

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
    loadHoldings() {
      if (!this.$services.wallets.getCurrentWallet()) {
        return;
      }

      this.$services.neo
        .fetchHoldings(this.$services.wallets.getCurrentWallet().address)
        .then((data) => {
          this.portfolio.balance = data.totalBalance;
          this.portfolio.changeUsd = data.change24hrValue;
          this.portfolio.changePercent = data.change24hrPercent;
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


