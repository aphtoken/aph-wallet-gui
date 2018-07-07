<template>
  <section id="dex--order-book">
    <div class="header">
      <h1 class="underlined">Order book</h1>
    </div>
    <div class="body">
      <div class="book" v-if="$store.state.orderBook">
        <div class="order-book-table asks">
          <div class="header">
            <div class="cell">price ({{ $store.state.currentMarket.baseCurrency }})</div>
            <div class="cell">size</div>
            <div class="cell">&nbsp;</div>
          </div>
          <div class="body">
            <div class="row" v-for="(ask, index) in $store.state.orderBook.asks" :key="index">
              <div class="cell price red" @click="setPrice(ask.price)">{{ $formatNumber(ask.price) }}</div>
              <div class="cell quantity" @click="setQuantity(ask.quantity)">{{ $formatNumber(ask.quantity) }}</div>
              <div class="cell graph">
                <span class="size-bar red" :style="{ width: (ask.quantityRatio * 100) + '%' }"></span>
              </div>
            </div>
          </div>
        </div>
        <div class="spread-divider">
          <div class="label">spread</div>
          <div class="value">{{ $formatNumber($store.state.orderBook.spread) }}</div>
          <div>&nbsp;</div>
        </div>
        <div class="order-book-table bids">
          <div class="body">
            <div class="row" v-for="(bid, index) in $store.state.orderBook.bids" :key="index">
              <div class="cell price green" @click="setPrice(bid.price)">{{ $formatNumber(bid.price) }}</div>
              <div class="cell quantity" @click="setQuantity(bid.quantity)">{{ $formatNumber(bid.quantity) }}</div>
              <div class="cell graph" >
                <span class="size-bar green" :style="{ width: (bid.quantityRatio * 100) + '%' }"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
let loadBookIntervalId;
let storeUnwatch;

export default {

  beforeDestroy() {
    clearInterval(loadBookIntervalId);
    storeUnwatch();

    this.$store.dispatch('unsubscribeFromMarket', {
      market: this.$store.state.currentMarket,
    });
  },

  mounted() {
    this.loadBook();
    loadBookIntervalId = setInterval(() => {
      this.loadBook();
    }, this.$constants.intervals.TRANSACTIONS_POLLING);

    storeUnwatch = this.$store.watch(
      () => {
        return this.$store.state.currentMarket;
      }, (oldValue, newValue) => {
        this.loadBook();

        if (oldValue && !newValue) {
          this.$store.dispatch('unsubscribeFromMarket', {
            market: oldValue,
          });
        } else if (!oldValue || oldValue.marketName !== newValue.marketName) {
          this.$store.dispatch('unsubscribeFromMarket', {
            market: oldValue,
          });

          this.$store.dispatch('subscribeToMarket', {
            market: newValue,
          });
        }
      });
  },

  methods: {
    loadBook() {
      if (!this.$store.state.currentMarket) {
        return;
      }

      setTimeout(() => {
        const asksContainer = this.$refs.asks;

        if (asksContainer) {
          asksContainer.scrollTop = asksContainer.scrollHeight;
        }
      }, 500);
    },

    setPrice(price) {
      this.$store.commit('setOrderPrice', price.toString());
    },

    setQuantity(quantity) {
      this.$store.commit('setOrderQuantity', quantity.toString());
    },
  },
};
</script>

<style lang="scss">
#dex--order-book {
  @extend %tile-light;

  display: flex;
  flex-direction: column;

  .header {
    padding: $space $space 0;
    flex: none;

    h1.underlined {
      @extend %underlined-header-sm;

      margin-bottom: 0;
    }
  }

  .body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: $space;

    .book {
      display: flex;
      flex-direction: column;
      flex: 1;

      .spread-divider {
        align-items: center;
        border-bottom: $border-table-header;
        border-top: $border-table-header;
        display: flex;
        flex: none;
        margin: $space-sm 0;
        padding: $space-sm 0;

        > * {
          flex: 1;
        }

        .label {
          @extend %small-uppercase-grey-label;
        }

        .value {
          font-family: GilroyMedium;
        }
      }

      .order-book-table {
        @extend %dex-table-flex;

        flex: 1;

        .cell {
          &.price, &.quantity {
            cursor: pointer;
          }

          &.graph {
            font-size: 0;
            text-align: right;

            .size-bar {
              height: toRem(12px);
              display: inline-block;

              &.green {
                background-color: $light-green;
                border-left: $border-width-thin solid $green;
              }

              &.red {
                background-color: $light-red;
                border-left: $border-width-thin solid $red;
              }
            }
          }
        }
        
        &.asks {
          .body {
            flex-direction: column-reverse;
          }
        }
      }
    }
  }
}
</style>


