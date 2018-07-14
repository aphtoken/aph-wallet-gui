<template>
  <section id="dex--order-history">
    <div class="header">
      <h1 :class="[{selected: tab === 'Open'}]" @click="selectTab('Open')">{{$t('openOrders')}} ({{ openOrders.length }})</h1>
      <h1 :class="[{selected: tab === 'Completed'}]" @click="selectTab('Completed')">{{$t('completedOrders')}} ({{ completedOrders.length }})</h1>
    </div>
    <div class="body" v-if="$store.state.orderHistory">
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
            <tr v-for="(order, index) in ordersForTable" :key="index">
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
      return _.filter(this.$store.state.orderHistory, (order) => {
        return order.status === 'Open' || order.status === 'PartiallyFilled';
      }).map((order) => {
        return order;
      });
    },

    completedOrders() {
      return _.filter(this.$store.state.orderHistory, (order) => {
        return order.status !== 'Open' && order.status !== 'PartiallyFilled';
      }).map((order) => {
        return order;
      });
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
  },

  mounted() {
    this.loadOrders();

    loadOrdersIntervalId = setInterval(() => {
      this.loadOrders();
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

    loadOrders() {
      this.$store.dispatch('fetchOrderHistory');
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
    height: calc(100% - 42px);
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
}
</style>


