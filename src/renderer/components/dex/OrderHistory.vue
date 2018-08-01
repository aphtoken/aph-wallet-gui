<template> 
  <section id="dex--order-history">
    <div class="header">
      <h1 :class="[{selected: tab === 'Open'}]" @click="selectTab('Open')">{{$t('openOrders')}} ({{ openOrders.length }})</h1>
      <h1 :class="[{selected: tab === 'Completed'}]" @click="selectTab('Completed')">{{$t('completedOrders')}} ({{ completedOrders.length }})</h1>
    </div>
    <div class="body">
      <div class="history">
        <table class="order-history-table">
          <thead>
            <tr>
              <th>{{$t('order')}}</th>
              <th>{{$t('type')}}</th>
              <th>{{$t('pairLc')}}</th>
              <th>{{$t('filled')}}</th>
              <th>{{$t('unitsTotal')}}</th>
              <th>{{$t('priceLc')}}</th>
              <th>{{$t('created')}}</th>
              <th class="status" width="1">{{$t('status')}}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(order, index) in filteredOrders" :key="index">
              <td :class="['side', {green: order.side === 'Buy', red: order.side === 'Sell'}]">{{ order.side }}</td>
              <td class="type">{{ order.type }}</td>
              <td class="market">{{ order.marketName }}</td>
              <td class="filled">{{ $formatNumber(order.quantity - order.quantityRemaining) }}</td>
              <td class="units-total">{{ $formatNumber(order.quantity) }}</td>
              <td class="price">{{ $formatNumber(order.price) }}</td>
              <td class="created">{{ $formatDateShort(order.created) }} {{ $formatTime(order.created) }}</td>
              <td class="status">
                <div v-if="order.status === 'Open' || order.status === 'PartiallyFilled'" class="btn-cancel" @click="cancelOrder(order)">
                  <aph-icon name="cancel"></aph-icon>
                  <p>{{$t('cancelUc')}}</p>
                </div>
                <div v-else-if="order.status === 'Filled'">
                  <p>{{$t('filledUc')}}</p>
                </div>
                <div v-else-if="order.status === 'Cancelled'">
                  <p>{{$t('cancelled')}}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="footer">
      <div :class="['option', {active: $store.state.ordersToShow === $constants.orders.ALL_SWITCH}]" @click="$store.commit('setOrdersToShow', $constants.orders.ALL_SWITCH)">All</div>
      <div :class="['option', {active: $store.state.currentMarket && $store.state.ordersToShow === $store.state.currentMarket.marketName}]" @click="$store.commit('setOrdersToShow', $store.state.currentMarket.marketName)">{{ $store.state.currentMarket ? $store.state.currentMarket.marketName : '' }}</div>
    </div>
    <aph-loader identifier="fetchOrderHistory"></aph-loader>
  </section>
</template>

<script>
let loadOrdersIntervalId;

export default {
  beforeDestroy() {
    clearInterval(loadOrdersIntervalId);
  },

  computed: {
    openOrders() {
      return this.$store.state.orderHistory ? _.filter(this.$store.state.orderHistory, (order) => {
        return order.status === 'Open' || order.status === 'PartiallyFilled';
      }).map((order) => {
        return order;
      }) : [];
    },

    completedOrders() {
      return this.$store.state.orderHistory ? _.filter(this.$store.state.orderHistory, (order) => {
        return order.status !== 'Open' && order.status !== 'PartiallyFilled';
      }).map((order) => {
        return order;
      }) : [];
    },

    ordersForTable() {
      switch (this.tab) {
        case 'Open':
          return this.openOrders;
        case 'Completed':
          return this.completedOrders;
        default:
          return this.openOrders;
      }
    },

    filteredOrders() {
      if (this.$store.state.ordersToShow === this.$constants.orders.ALL_SWITCH) {
        return this.ordersForTable;
      }

      return this.ordersForTable.filter((order) => {
        return order.marketName === this.$store.state.currentMarket.marketName;
      });
    },
  },

  mounted() {
    this.loadOrders();

    loadOrdersIntervalId = setInterval(() => {
      this.loadOrders(true);
    }, this.$constants.intervals.TRANSACTIONS_POLLING);
  },

  data() {
    return {
      tab: 'Open',
    };
  },

  methods: {
    selectTab(tab) {
      this.tab = tab;
    },

    loadOrders(isRequestSilent = false) {
      this.$store.dispatch('fetchOrderHistory', { isRequestSilent });
    },

    cancelOrder(order) {
      this.$services.dex.cancelOrder(order)
        .then((res) => {
          this.$services.alerts.success(res);
        })
        .catch((e) => {
          this.$services.alerts.error(e);
        });
    },
  },
};
</script>

<style lang="scss">
#dex--order-history {
  @extend %tile-light;

  height: 100%;

  .header {
    display: flex;
    padding: $space $space 0;

    h1 {
      @extend %underlined-header-sm;

      cursor: pointer;
      margin-bottom: 0;

      & + h1 {
        margin-left: $space-lg;
      }

      &:not(.selected) {
        color: $grey;

        &:after {
          background: transparent;
        }
      }
    }
  }


  .body {
    height: calc(100% - 73px);
    overflow-y: auto;
    padding: $space;

    .order-history-table {
      @extend %dex-table;

      th, td {
        &.status {
          text-align: right;
        }
      }

      td.status {
        @extend %small-uppercase-grey-label-dark;

        .btn-cancel {
          align-items: center;
          cursor: pointer;
          display: flex;
          flex-direction: row;
          justify-content: flex-end;

          .aph-icon {
            margin-right: $space-sm;

            svg {
              height: toRem(20px);
            }

            .fill {
              fill: $dark-grey;
            }
          }
        }
      }
    }
  }

  .footer {
    display: flex;
    justify-content: space-evenly;

    .option {
      border-bottom: $border-width-thick solid transparent;
      color: $purple;
      cursor: pointer;
      flex: none;
      font-family: GilroyMedium;
      font-size: toRem(14px);
      margin-left: $space;
      padding: $space-sm $space;
      text-align: center;

      &:hover, &.active {
        border-color: $purple;
      }
    }
  }
}
</style>


