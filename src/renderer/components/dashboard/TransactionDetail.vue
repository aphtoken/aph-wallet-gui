<template>
  <section id="dashboard--transaction-detail">
    <div class="header">
      <h1 class="underlined">Transaction</h1>
    </div>
    <div class="body" v-if="$store.state.activeTransaction">
      <div class="section">
        <div class="row">
          <div class="column confirmed" v-if="this.$store.state.activeTransaction.confirmed">
            <aph-icon name="confirmed-big"></aph-icon>
            <div class="label">Confirmed</div>
          </div>
          <div class="column unconfirmed" v-else>
            <aph-icon name="unconfirmed-big"></aph-icon>
            <div class="label">Unconfirmed</div>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <div class="label">Hash</div>
            <div class="value truncate">{{ $store.state.activeTransaction.txid }}</div>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <div class="label">Date</div>
            <div class="value">{{ $formatDate($store.state.activeTransaction.blocktime) }}</div>
          </div>
          <div class="column">
            <div class="label">Time</div>
            <div class="value">{{ $formatTime($store.state.activeTransaction.blocktime) }}</div>
          </div>
          <div class="column">
            <div class="label">Block</div>
            <div class="value purple">{{ $formatNumber($store.state.activeTransaction.block) }}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="row">
          <div class="column">
            <div class="label">From</div>
            <aph-simple-transactions :transactions="fromTransactions" :show-block-time="false"></aph-simple-transactions>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <div class="label">To</div>
            <aph-simple-transactions :transactions="toTransactions" :show-block-time="false"></aph-simple-transactions>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="row">
          <div class="column">
            <div class="label">Network Fee</div>
            <div class="value">{{ $formatNumber($store.state.activeTransaction.net_fee) }} GAS</div>
          </div>
          <div class="column">
            <div class="label">System Fee</div>
            <div class="value">{{ $formatNumber($store.state.activeTransaction.sys_fee) }} GAS</div>
          </div>
          <div class="column">
            <div class="label">Size</div>
            <div class="value">{{ $formatNumber($store.state.activeTransaction.size) }} Bytes</div>
          </div>
        </div>
        <div class="row">
          <div class="column" v-if="this.$store.state.activeTransaction.confirmed">
            <div class="label">Confirmations</div>
            <div class="value">{{ $formatNumber(confirmations) }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  computed: {
    confirmations() {
      if (!this.$store.state.activeTransaction) {
        return 0;
      }
      return this.$store.state.currentNetwork.bestBlock.index - this.$store.state.activeTransaction.block;
    },

    fromTransactions() {
      if (!this.$store.state.activeTransaction) {
        return [];
      }
      return this.$store.state.activeTransaction.vin;
    },

    toTransactions() {
      if (!this.$store.state.activeTransaction) {
        return [];
      }
      return this.$store.state.activeTransaction.vout;
    },
  },
};
</script>

<style lang="scss">
#dashboard--transaction-detail {
  @extend %tile-light;

  display: flex;
  flex-direction: column;
  padding-bottom: $space-lg;

  .header {
    padding: $space-lg;
    position: relative;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    overflow: auto;
    padding: 0 $space-lg;

    .transactions-table {
      td {
        border: none;
        padding: 0;

        &.amount {
          text-align: left;
        }
      }

      tr + tr {
        td {
          padding-top: $space-sm;
        }
      }
    }

    .section + .section {
      margin-top: $space-lg;
    }

    .row {
      display: flex;

      .column {
        flex: 1;

        .label {
          @extend %small-uppercase-grey-label;

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

        &.confirmed, &.unconfirmed {
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

        &.unconfirmed {
          .label {
            color: $red;
          }

          .aph-icon {
            svg {
              .fill {
                fill: $red;
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
}
</style>

