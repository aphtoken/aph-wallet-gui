<template>
  <div class="transaction-detail">
    <div class="header">
      <h1 class="underlined">Transaction</h1>
    </div>
    <div class="body">
      <div class="section">
        <div class="row">
          <div class="column">
            <div class="label">Hash</div>
            <div class="value truncate">{{ transaction.hash }}</div>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <div class="label">Date</div>
            <div class="value">{{ $formatDate(transaction.blocktime) }}</div>
          </div>
          <div class="column">
            <div class="label">Time</div>
            <div class="value">{{ $formatTime(transaction.blocktime) }}</div>
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
        
        <div class="row">
          <div class="column">
            <div class="label">Block</div>
            <div class="value purple">{{ $formatNumber(transaction.block) }}</div>
          </div>
          <div class="column">
            <div class="label">Status</div>
            <div class="value red">{{ transaction.status }}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <!-- UI for inputs and outputs needs some improvement to reflect multiple values and the 3 different attributes (address, symbol, value) -->
        <div class="row">
          <div class="column">
            <div class="label">From</div>
            <div class="value" v-for="(input, index) in transaction.vin">
              {{ input.address }} {{input.symbol}} {{input.value}}
            </div>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <div class="label">To</div>
            <div class="value purple" v-for="(output, index) in transaction.vout">
              {{ output.address }} {{output.symbol}} {{output.value}}
            </div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="row">
          <div class="column">
            <div class="label">Network Fee</div>
            <div class="value">{{ $formatNumber(transaction.net_fee) }} GAS</div>
          </div>
          <div class="column">
            <div class="label">System Fee</div>
            <div class="value">{{ $formatNumber(transaction.sys_fee) }} GAS</div>
          </div>
          <div class="column">
            <div class="label">Size</div>
            <div class="value">{{ $formatNumber(transaction.size) }} Bytes</div>
          </div>
        </div>
        <div class="row has-equal-columns">
          <div class="column">
            <div class="label">Confirmations</div>
            <div class="value">{{ $formatNumber(transaction.confirmations) }}</div>
          </div>
          <div class="column confirmed" v-if="this.transaction.confirmed">
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
  data() {
    return {
      transaction: { },
    };
  },

  props: {
    hash: {
      type: String,
    },
  },


  methods: {
    loadTransactionDetails() {
      if (!this.hash) {
        return;
      }

      this.$services.neo
        .fetchTransactionDetails(this.hash)
        .then((data) => {
          this.transaction = data;
        })
        .catch((e) => {
          console.log(e);
        });
    },

    viewTransaction(hash) {
      this.$router.push({ path: `/dashboard/trx/${hash}` });
    },
  },

  mounted() {
    this.loadTransactionDetails();
  },
};
</script>

<style lang="scss">
.transaction-detail {
  background: white;
  border-radius: $border-radius;
  display: flex;
  flex-direction: column;
  padding-bottom: $space;

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
    padding: $space $space 0 $space;

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

        &:last-child {
          flex: 3;
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

