<template>
  <section id="assets">
    <div class="header">
      <h1 class="underlined">Token Sale</h1>
    </div>
    <div class="body">
      <div class="token">
        <aph-select :options="tokens" :light="true" placeholder="Select a token" v-model="token"></aph-select>
      </div>
      <div class="currency">
        <aph-select :options="currencies" :light="true" placeholder="Select a currency" v-model="currency"></aph-select>
      </div>
      <div class="amount">
        <aph-input placeholder="Enter Amount" v-model="amount"></aph-input>
        <div class="symbol">{{ currency ? currency.value : '' }}</div>
        <div class="max" v-if="currency" @click="setAmountToMax">max</div>
      </div>
      <div class="footer">
        <button class="send-btn" @click="send()" :disabled="shouldDisableSendButton">{{ sendButtonLabel }}</button>
      </div>
    </div>
  </section>
</template>

<script>
import { BigNumber } from 'bignumber.js';
export default {

  data() {
    return {
      token: null,
      amount: '',
      currency: null,
      sending: false,
    };
  },

  computed: {
    tokens() {
      return [{
        label: 'APH',
        value: '591eedcd379a8981edeefe04ef26207e1391904a',
      }];
    },

    currencies() {
      return this.$store.state.holdings.reduce(
        (result, { name, symbol, asset, isNep5, unitValue, balance }) => {
          if (!name || !symbol || isNep5 === true) {
            return result;
          }

          result.push({
            label: `${name} (${this.$formatNumber(balance)})`,
            value: {
              symbol,
              name,
              asset,
              isNep5,
              label: `${name} (${balance})`,
              unitValue,
              balance,
            },
            asset,
            isNep5,
            unitValue,
          });

          return result;
        }, []);
    },

    sendButtonLabel() {
      return this.sending ? 'Waiting for confirmation...' : 'Send';
    },

    shouldDisableSendButton() {
      return !this.token || !this.amount || !this.currency || !parseFloat(this.amount) || this.sending === true;
    },
  },

  methods: {
    cleanAmount() {
      if (!this.amount) {
        return;
      }

      let cleanAmount = this.amount.replace(/[^\d.]/g, '');

      if (cleanAmount && cleanAmount.length > 0) {
        if (this.currency && this.currency.symbol === 'NEO') {
          cleanAmount = Math.floor(new BigNumber(cleanAmount)).toFixed(0);
        } else if (cleanAmount[cleanAmount.length - 1] !== '.'
          && cleanAmount[cleanAmount.length - 1] !== '0') {
          const n = new BigNumber(cleanAmount);
          cleanAmount = this.$formatNumber(n, this.$constants.formats.WHOLE_NUMBER_NO_COMMAS);
        }
      }

      if (this.amount !== cleanAmount) {
        setTimeout(() => {
          // come off of the watch thread to set it
          this.amount = cleanAmount;
        }, 10);
      }
    },

    setAmountToMax() {
      if (this.currency) {
        this.amount = this.currency.balance.toString();
      }
    },

    send() {
      this.sending = true;
      this.$services.neo.participateInTokenSale(this.token,
        this.currency.asset, this.amount)
        .then((res) => {
          this.sending = false;
          console.log(res);
        })
        .catch((e) => {
          this.sending = false;
          this.$services.alerts.error(e);
        });
    },
  },

  watch: {
    currency() {
      this.cleanAmount();
    },

    amount() {
      this.cleanAmount();
    },
  },

};
</script>

<style lang="scss">
#assets {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;

  .header {
    padding: $space-lg $space-lg 0;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  
  .body {
    flex: 1;
    overflow: auto;
    padding: 0 $space-lg $space-lg;
    background-color: white;

    .aph-input {
      border-color: $background;
      margin: $space;

      &.focused {
        border-color: $purple;
      }

      input {
        color: $dark;
      }

      .placeholder {
        color: $grey;
        font-family: GilroyMedium;
      }
    }

    .aph-select {
      margin: $space;
    }

    .amount {
      position: relative;
      margin-top: $space;
      width: 50%;

      input {
        box-sizing: border-box;
        padding-right: $space-lg;
      }

      .symbol {
        @extend %small-uppercase-grey-label;

        position: absolute;
        top: toRem(18px);
        right: 0;
      }

      .max {
        bottom: toRem(16px);
        color: $grey;
        cursor: pointer;
        font-size: toRem(10px);
        position: absolute;
        right: 0;
        z-index: 0;
      }
    }

    .estimated-value {
      display: flex;
      margin-top: $space;

      .label {
        @extend %small-uppercase-grey-label;
      }
      .value {
        font-family: GilroySemibold;
        font-size: toRem(12px);
        margin-left: $space-sm;
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

      border-bottom-left-radius: $border-radius;
    }

    .next-btn, .send-btn {
      @extend %btn-footer;

      border-bottom-right-radius: $border-radius;
    }
  }
}
</style>


