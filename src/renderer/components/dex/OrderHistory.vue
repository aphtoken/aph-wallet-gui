<template>
  <section id="dex--order-history">
    <aph-spinner-wrapper identifier="fetchOrderHistory">
      <div class="header">
        <h1 :class="[{selected: tab === 'Open'}]" @click="selectTab('Open')">{{$t('openOrders')}} ({{ openOrders.length }})</h1>
        <h1 :class="[{selected: tab === 'Completed'}]" @click="selectTab('Completed')">{{$t('completedOrders')}} ({{ completedOrders.length }})</h1>
      </div>
      <div class="body">
        <div class="history">
          <div class="order-history-table-wrapper" ref="scroll">
            <table class="order-history-table">
              <thead ref="thead">
                <tr>
                  <th>{{ $t('order') }}</th>
                  <th>{{ $t('pairLc') }}</th>
                  <th>{{ $t('filled') }}</th>
                  <th>{{ $t('unitsTotal') }}</th>
                  <th class="price">{{ $t('priceLc') }}</th>
                  <th>{{ $t('created')}}</th>
                  <th class="status">{{ $t('status') }}</th>
                </tr>
              </thead>
              <tbody v-if="$store.state.currentMarket">
                <tr v-for="(order, index) in filteredOrders" :key="index">
                  <td :class="['side', {green: order.side === 'Buy', red: order.side === 'Sell'}]">{{ order.side }}</td>
                  <td class="market">{{ order.marketName }}</td>
                  <td class="filled">{{ $formatNumber(order.quantity - order.quantityRemaining) }}</td>
                  <td class="units-total">{{ $formatNumber(order.quantity) }}</td>
                  <td class="price">{{ $formatNumber(order.price) }}</td>
                  <td class="created">{{ $formatDateShort(order.created) }} {{ $formatTime(order.created) }}</td>
                  <td class="status">
                    <div v-if="order.status === 'Open' || order.status === 'PartiallyFilled'" class="open-or-partial">
                      <div v-if="order.status === 'PartiallyFilled'" class="partial">
                        <aph-icon name="info"></aph-icon>
                        <span>{{$t('partial')}}</span>
                      </div>
                      <div v-else class="partial">
                        <span>{{$t('open')}}</span>
                      </div>
                      <aph-icon name="cancel" class="btn-cancel" @click="cancelOrder(order)"
                                :title="$t('cancel')"></aph-icon>
                    </div>
                    <div v-else-if="order.status === 'Filled'">
                      <span>{{ $t('filledUc') }}</span>
                    </div>
                    <div v-else-if="order.status === 'Cancelled'">
                      <span>{{ $t('cancelled') }}</span>
                    </div>
                    <div v-else-if="order.status === 'Cancelling'">
                      <span>{{ $t('cancelling') }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="footer">
        <div :class="['option', {active: $store.state.ordersToShow === $constants.orders.ALL_SWITCH}]" @click="$store.commit('setOrdersToShow', $constants.orders.ALL_SWITCH)">All</div>
        <div :class="['option', {active: $store.state.currentMarket && $store.state.ordersToShow === $store.state.currentMarket.marketName}]" @click="$store.commit('setOrdersToShow', $store.state.currentMarket.marketName)">{{ $store.state.currentMarket ? $store.state.currentMarket.marketName : '' }}</div>
      </div>

    </aph-spinner-wrapper>
  </section>
</template>

<script>
let loadOrdersIntervalId;
let cancelledOrders = {};

export default {
  beforeDestroy() {
    clearInterval(loadOrdersIntervalId);
    this.$refs.scroll.removeEventListener('scroll', this.fixHeader);
  },

  computed: {
    allOrders() {
      if (!this.$store.state.orderHistory) {
        return [];
      }

      const orders = this.$store.state.orderHistory.map((order) => {
        // if the order comes back from the api as still open or partially filled,
        // but we know we recently cancelled it, still show as cancelling
        if (_.has(cancelledOrders, order.orderId)) {
          if (_.includes(['Open', 'PartiallyFilled', 'Cancelling'], order.status)
            && moment.utc().diff(_.get(cancelledOrders, order.orderId), 'milliseconds')
              < this.$constants.timeouts.CANCEL_ORDER) {
            order.status = 'Cancelling';
          } else {
            cancelledOrders = _.omit(cancelledOrders, order.orderId);
          }
        }

        return order;
      });

      return orders;
    },

    completedOrders() {
      return _.filter(this.allOrders, (order) => {
        return order.status !== 'Open' && order.status !== 'PartiallyFilled';
      });
    },

    filteredOrders() {
      if (this.$store.state.ordersToShow === this.$constants.orders.ALL_SWITCH) {
        return this.ordersForTable;
      }

      return this.ordersForTable.filter((order) => {
        return order.marketName === this.$store.state.currentMarket.marketName;
      });
    },

    openOrders() {
      return _.filter(this.allOrders, (order) => {
        return order.status === 'Open' || order.status === 'PartiallyFilled' || order.status === 'Cancelling';
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
    this.$refs.scroll.addEventListener('scroll', this.fixHeader);
    this.loadOrders();

    loadOrdersIntervalId = setInterval(() => {
      this.loadOrdersSilently();
    }, this.$constants.intervals.TRANSACTIONS_POLLING);
  },

  data() {
    return {
      tab: 'Open',
    };
  },

  methods: {
    fixHeader() {
      this.$refs.thead.style.transform = `translate(0, ${
        this.$refs.scroll.scrollTop
      }px)`;
    },

    selectTab(tab) {
      this.tab = tab;
    },

    loadOrders() {
      this.$store.dispatch('fetchOrderHistory', { isRequestSilent: false });
    },
    loadOrdersSilently() {
      this.$store.dispatch('fetchOrderHistory', { isRequestSilent: true });
    },

    cancelOrder(order) {
      this.$services.dex.cancelOrder(order)
        .then((res) => {
          this.$services.alerts.success(res);
          order.status = 'Cancelling';
          _.set(cancelledOrders, order.orderId, moment.utc());
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
    },
    showLearnMore() {
      this.$store.commit('setShowLearnMore', true);
    },
  },
};
</script>

<style lang="scss">
#dex--order-history {
  @extend %tile-light;

  display: flex;
  flex-direction: column;
  height: 100%;

  .header {
    display: flex;
    flex: none;
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
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    padding: $space;

    .history {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;

      .order-history-table-wrapper {
        flex: 1;
        overflow: auto;

        .order-history-table {
          @extend %dex-table;

          thead {
            background: white;
          }

          th, td {
            &.status {
              text-align: right;

              p {
                margin: 0;
                padding: 0;
              }
            }
          }

          td.status {
            @extend %small-uppercase-grey-label-dark;

            .open-or-partial {
              align-items: center;
              display: flex;
              flex-direction: row;
              justify-content: flex-end;

              .partial {
                align-items: center;
                color: $purple;
                display: flex;
                flex-direction: row;
                justify-content: flex-end;
                margin: 0 $space;

                .aph-icon {
                  .fill {
                    fill: $purple !important;
                  }
                }
              }
              .aph-icon {
                margin-right: $space-sm;

                svg {
                  height: toRem(20px);
                }
              }

              .btn-cancel {
                cursor: pointer;

                .fill {
                  fill: $dark-grey;
                }
              }
            }
          }
        }
      }
    }
  }

  .footer {
    display: flex;
    flex: none;
    justify-content: flex-start;
    position: relative;

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

.Night {
  #dex--order-history {
    .body {
      .history {
        .order-history-table-wrapper {
          .order-history-table {
            thead {
              background: $background-night;
            }
          }
        }
      }
    }
  }
}
</style>


