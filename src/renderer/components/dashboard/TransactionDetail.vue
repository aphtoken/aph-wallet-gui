<template>
  <div class="transaction-detail">
    <div class="header">
      <h1 class="underlined">Transaction</h1>
      <div class="close" @click="close()">
        close
      </div>
    </div>
    <div class="body">
      <div class="section">
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
        <!-- these need to be re-thought, where does the value come from? the fiat value at the time of the transaction?
            also a single transaction can transfer more than one asset, should these be a list, like inputs/outputs?
        <div class="row">
          <div class="column">
            <div class="label">Token</div>
            <div class="value red">{{ $formatNumber(transaction.amount) }} {{ transaction.currency }}</div>
          </div>
          <div class="column">
            <div class="label">Value</div>
            <div class="value">{{ $formatMoney(transaction.usd) }} USD</div>
          </div>
        </div>
        -->
      </div>
      <div class="section">
        <div class="row">
          <div class="column">
            <div class="label">From</div>
            <aph-simple-transactions :transactions="fromTransactions"></aph-simple-transactions>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <div class="label">To</div>
            <aph-simple-transactions :transactions="toTransactions"></aph-simple-transactions>
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
        <div class="row has-equal-columns">
          <div class="column" v-if="this.$store.state.activeTransaction.confirmed">
            <div class="label">Confirmations</div>
            <div class="value">{{ $formatNumber($store.state.activeTransaction.confirmations) }}</div>
          </div>
          <div class="column confirmed" v-if="this.$store.state.activeTransaction.confirmed">
            <aph-icon name="confirmed"></aph-icon>
            <div class="label">Confirmed</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    activeTransactionHash() {
      return this.$store.state.activeTransactionHash;
    },

    fromTransactions() {
      return this.$store.state.activeTransaction.vin;
    },

    toTransactions() {
      return this.$store.state.activeTransaction.vout;
    },
  },

  methods: {
    close() {
      this.$store.state.activeTransaction.active = false;
      this.$store.commit('clearActiveTransaction');
    },
  },
};
</script>

<style lang="scss">
.transaction-detail {
  @extend %tile-light;

  display: flex;
  flex-direction: column;
  padding-bottom: $space;

  .header {
    padding: $space;
    position: relative;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
    .close {
      position: absolute;
      right: 3px;
      top: 3px;
      padding: 10px;
      cursor: pointer;
    }
  }

  .body {
    overflow: auto;
    padding: $space $space 0 $space;

    .transactions-table {
      td {
        border: none;
        padding: $space-sm 0;
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

        &.confirmed {
          align-items: center;
          display: flex;

          .label {
            color: $green;
            margin: 0 0 0 $space-sm;
          }

          .aph-icon {
            svg {
              height: toRem(30px);

              .stroke {
                stroke: $green;
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

