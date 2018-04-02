<template>
  <section id="send">
    <div class="header">
      <h1 class="underlined">Send</h1>
    </div>
    <template v-if="showConfirmation">
      <div class="body">
        <div class="row">
          <div class="column">
            <div class="label">Amount</div>
            <div class="value">{{ $formatNumber(amount) }}</div>
          </div>
          <div class="column">
            <div class="label">Value</div>
            <div class="value">{{ $formatMoney(currency ? currency.unitValue * amount : 0) }} USD</div>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <div class="label">Token</div>
            <div class="value">{{ currency.label }}</div>
          </div>
        </div>
        <!-- <div class="row">
          <div class="column">
            <div class="label">Recipient</div>
            <div class="value purple">John Doe</div>
          </div>
        </div> -->
        <div class="row">
          <div class="column">
            <div class="label">Address</div>
            <div class="value">{{ address }}</div>
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="back-btn" @click="showConfirmation = false">Back</div>
        <div class="send-btn" @click="send()">Send</div>
      </div>
    </template>
    <template v-else>
      <div class="body">
        <div class="currency">
          <aph-select :options="currencies" :light="true" placeholder="Select a currency" v-model="currency"></aph-select>
        </div>
        <div class="address">
          <aph-input placeholder="Enter Send to Address" v-model="address" @enter="next"></aph-input>
        </div>
        <div class="amount">
          <aph-input placeholder="Enter Amount" v-model="amount" @enter="next"></aph-input>
          <div class="symbol">{{ currency ? currency.value : '' }}</div>
        </div>
        <div class="estimated-value">
          <div class="label">Estimated</div>
          <div class="value">{{ $formatMoney(currency ? currency.unitValue * amount : 0) }} USD</div>
        </div>
      </div>
      <div class="footer">
        <router-link class="cancel-btn" to="/dashboard">Cancel</router-link>
        <div class="next-btn" v-if="showNextButton" @click="next">Next</div>
      </div>
    </template>
  </section>
</template>

<script>
export default {
  computed: {
    currencies() {
      return this.$store.state.holdings.map(
        ({ name, symbol, asset, isNep5, unitValue, balance }) => {
          return {
            label: `${name}   Balance: ${balance}`,
            value: symbol,
            asset,
            isNep5,
            unitValue,
          };
        });
    },

    showNextButton() {
      return this.address && this.amount && parseFloat(this.amount) && this.currency;
    },
  },

  methods: {
    next() {
      if (!(this.address && this.amount && parseFloat(this.amount) && this.currency)) {
        return;
      }

      this.showConfirmation = true;
    },

    send() {
      this.$services.neo.sendFunds(this.address, this.currency.asset,
        this.amount, this.currency.isNep5);
    },
  },
  data() {
    return {
      address: null,
      amount: null,
      currency: null,
      showConfirmation: false,
    };
  },
};
</script>


<style lang="scss">
#send {
  @extend %tile-light;

  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    flex: none;
    padding: $space;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    flex: 1;
    padding: $space;

    .aph-input {
      input {
        color: $dark;

        &::placeholder {
          color: $dark;
          font-family: GilroyMedium;
        }
      }
    }

    .amount {
      position: relative;
      margin-top: $space;
      width: 50%;

      input {
        box-sizing: border-box;
        padding-right: $space-xl;
      }

      .symbol {
        @extend %small-uppercase-grey-label;

        position: absolute;
        top: toRem(18px);
        right: 0;
      }
    }

    .estimated-value {
      display: flex;
      margin-top: $space;

      .label {
        @extend %small-uppercase-grey-label;
      }
      .value {
        margin-left: $space-sm;
        font-family: GilroySemibold;
        font-size: toRem(12px);
      }
    }

    .currency {
      margin-bottom: $space;
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

          &.truncate {
            @include truncate();
          }
        }

        & + .column {
          margin-left: $space-xl;
        }
      }

      & + .row {
        margin-top: $space;
      }
    }
  }

  .footer {
    display: flex;
    flex: none;
    flex-direction: row;

    > * {
      flex: 1;
    }

    .cancel-btn, .back-btn {
      @extend %btn-footer-light;
    }

    .next-btn, .send-btn {
      @extend %btn-footer;
    }
  }
}
</style>
