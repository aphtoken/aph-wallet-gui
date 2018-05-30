<template>
  <section id="history--table">
    <div class="header">
      <div class="cell">Date</div>
      <div class="cell">Token</div>
      <div class="cell">Amount</div>
      <!--This would require getting the fiat value at that point in time, put this off till a later release <div class="cell">Total</div>-->
      <div class="cell status">Status</div>
    </div>
    <div class="body">
      <div v-if="!transactions().length" class="zero-state">
        <aph-icon name="no-transactions"></aph-icon>
        <div class="label">No transactions</div>
      </div>
      <div v-for="(transaction, index) in transactions()" :key="index"
           :class="['transaction', {active: transaction.active, increase: transaction.amount > 0}]">
        <div class="summary" @click="toggleTransaction(transaction)">
          <div class="cell date">{{ $formatDate(transaction.block_time) }}</div>
          <div class="cell token">{{ transaction.symbol }}</div>
          <div :class="['cell', 'amount', {decrease: transaction.value < 0, increase: transaction.value > 0}]">
            {{ $formatNumber(transaction.value) }}
          </div>
          <div class="cell status" v-if="transaction.details" @click.stop>
            <aph-icon name="confirmed" v-if="transaction.details.confirmed"></aph-icon>
            <aph-icon name="unconfirmed" v-else></aph-icon>
          </div>
        </div>
        <div class="details" v-if="transaction.details">
          <div class="section">
            <div class="row">
              <div class="column confirmed" v-if="transaction.details.confirmed">
                <aph-icon name="confirmed"></aph-icon>
                <div class="label">Confirmed</div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="row">
              <div class="column">
                <div class="label">Time</div>
                <div class="value">{{ $formatTime(transaction.details.blocktime) }}</div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="row">
              <div class="column">
                <div class="label">Hash</div>
                <div class="value">{{ transaction.details.txid }}</div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="row">
              <div class="column inputs">
                <div class="label">From</div>
                <aph-simple-transactions :transactions="transaction.details.vin"></aph-simple-transactions>
              </div>
            </div>
            <div class="row">
              <div class="column outputs">
                <div class="label">To</div>
                <aph-simple-transactions :transactions="transaction.details.vout"></aph-simple-transactions>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="row">
              <div class="column">
                <div class="label">Network Fee</div>
                <div class="value">{{ $formatNumber(transaction.details.net_fee) }} GAS</div>
              </div>
              <div class="column">
                <div class="label">System Fee</div>
                <div class="value">{{ $formatNumber(transaction.details.sys_fee) }} GAS</div>
              </div>
              <div class="column">
                <div class="label">Size</div>
                <div class="value">{{ $formatNumber(transaction.details.size) }} Bytes</div>
              </div>
            </div>
            <div class="row has-equal-columns">
              <div class="column" v-if="transaction.details.confirmed">
                <div class="label">Confirmations</div>
                <div class="value">{{ $formatNumber(transaction.details.confirmations) }}</div>
              </div>
              <div class="column">
                <div class="label">Confirmed in Block</div>
                <div class="value purple">{{ $formatNumber(transaction.details.block) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
let loadTransactionsIntervalId;

export default {
  beforeDestroy() {
    clearInterval(loadTransactionsIntervalId);
  },

  beforeMount() {
    this.loadTransactions();

    loadTransactionsIntervalId = setInterval(() => {
      this.loadTransactions();
    }, this.$constants.intervals.TRANSACTIONS_POLLING);
  },

  data() {
    return {
      activeTxid: null,
    };
  },

  methods: {
    isActive({ details }) {
      return this.activeTxid === details.txid;
    },

    loadTransactions() {
      this.$store.dispatch('findTransactions');
    },

    toggleTransaction({ details }) {
      this.activeTxid = this.activeTxid === details.txid ? null : details.txid;
    },

    transactions() {
      return this.$store.state.searchTransactions.map((transaction) => {
        return _.merge(transaction, {
          active: this.isActive(transaction),
          address: transaction.hash,
        });
      });
    },
  },
};
</script>


<style lang="scss">
#history--table {
  @extend %tile-light;

  padding: $space $space-lg;
  height: 95%;

  .header {
    display: flex;
    padding: 0;

    .cell {
      @extend %small-uppercase-grey-label;

      flex: 1;
      padding: $space;

      &.status {
        flex: none;
        text-align: center;
        width: toRem(100px);
      }
    }
  }

  .body {
    height: 90%;
    overflow-y: auto;

    > .zero-state {
      align-items: center;
      display: flex;
      height: 100%;
      justify-content: center;
      flex-direction: column;

      .aph-icon {
        svg {
          height: toRem(52px);

          .fill {
            fill: $purple;
          }
        }
      }

      .label {
        color: $purple;
        font-weight: GilroyMedium;
        margin-top: $space-lg;
      }
    }

    .transaction {
      @include transition(background-color);

      background-color: transparent;
      border-top: toRem(1px) solid $background;

      .summary {
        align-items: center;
        cursor: pointer;
        display: flex;
        flex-wrap: wrap;
      }

      .cell {
        flex: 1;
        font-family: GilroyMedium;
        padding: $space;

        .aph-icon {
          svg {
            height: toRem(30px);
          }
          .confirmed {
            .fill {
              fill: $green;
            }
          }
          .unconfirmed {
            .fill {
              fill: $red;
            }
          }
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

        &.status {
          flex: none;
          text-align: center;
          width: toRem(100px);
        }
      }

      &:hover, &.active {
        background-color: $light-grey;
      }

      .details {
        display: none;
        padding: $space;
        flex-wrap: wrap;

        .section {
          display: flex;
          width: 100%;
          flex-wrap: wrap;
        }

        .section + .section {
          margin-top: $space-lg;
        }

        .row {
          display: flex;
          width: 100%;

          .column {
            flex: 1;

            .label {
              @extend %small-uppercase-grey-label-dark;

              margin-bottom: $space-sm;
            }

            .value {
              font-family: GilroySemibold;
              font-size: toRem(12px);

              &.purple {
                color: $purple;
              }

              &.red {
                color: $red;
              }

              &.truncate {
                @include truncate();
              }
            }

            & + .column {
              margin-left: $space-xl;
            }

            &.confirmed {
              align-items: center;
              display: flex;
              padding-bottom: $space;

              .label {
                color: $green;
                margin: 0 0 0 $space-sm;
              }

              .aph-icon {
                svg {
                  height: toRem(40px);

                  .fill {
                    fill: $green;
                  }
                }
              }
            }
          }

          &.has-equal-columns {
            .column {
              flex: 1;
            }
          }

          & + .row {
            margin-top: $space;
          }
        }
      }
      &.active {
        .details {
          display: flex;
          width: 100%;

          .transactions-table {
            td {
              border: none;
              padding: 0;

              &.amount {
                text-align: left;
              }

              &.address {
                width: 60% !important;
              }
            }

            tr + tr {
              td {
                padding-top: $space-sm;
              }
            }
          }
        }
      }
    }
  }
}
</style>

