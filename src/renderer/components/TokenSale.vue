<template>
  <section id="token-sale">
    <div class="header">
      <h1 class="underlined">Participate in an Initial Coin Offering (ICO)</h1>
    </div>
    <div class="body">
      <div class="token">
        <aph-select :options="tokens" placeholder="Select ICO" v-model="token"></aph-select>
      </div>
      <div class="currency">
        <aph-select :options="currencies" placeholder="Buy With" v-model="currency"></aph-select>
      </div>
      <div class="amount">
        <aph-input placeholder="Enter Amount" v-model="amount"></aph-input>
        <div class="symbol">{{ currency ? currency.value : '' }}</div>
        <div class="max" v-if="currency" @click="setAmountToMax">max</div>
      </div>
      <div class="estimated-value">
        <div class="label">Estimated Amount</div>
        <div class="value">{{ $formatMoney(currency ? currency.unitValue * amount : 0) }} {{ $store.state.currency }}</div>
      </div>
    </div>
    <div class="disclaimer">
      <h2>Disclaimer - Urgent Instructions</h2>
      <p>Ensure that you are only sending tokens which are accepted for this ICO.</p>
      <p>Submitting multiple times could result in loss of funds.</p>
      <p>Aphelion is not responsible for loss of funds.</p>
      <input type="checkbox" id="confirm-disclaimer" v-model="agreed" />
      <label for="confirm-disclaimer">I Agree, I am responsible for this transfer of funds.</label>
    </div>
    <div class="footer">
      <button class="send-btn" @click="send()" :disabled="shouldDisableSendButton">{{ sendButtonLabel }}</button>
    </div>
  </section>
</template>

<script>
import { BigNumber } from 'bignumber.js';
export default {

  mounted() {
    this.$store.state.showPortfolioHeader = false;
  },
  beforeDestroy() {
    this.$store.state.showPortfolioHeader = true;
  },

  data() {
    return {
      token: null,
      amount: '',
      currency: null,
      agreed: false,
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
      return this.sending ? 'Waiting for confirmation...' : 'Purchase Now';
    },

    shouldDisableSendButton() {
      return !this.token || !this.amount || !this.currency
      || !parseFloat(this.amount) || this.agreed === false || this.sending === true;
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
#token-sale {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  background-color: $dark-purple;

  .header {
    color: $purple;
    margin-top: toRem(200px);
    text-align: center;
    font-family: GilroySemibold;
    padding: $space;
    
    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
      font-size: toRem(30px);
      
      &:after {
        background: white;
        width: toRem(200px);
        margin: $space-lg auto;
      }
    }
  }

  
  .body {
    padding: 0 $space-lg 0;
    width: toRem(500px);
    margin: $space auto;

    .aph-input {
      margin: $space 0;
      
      .placeholder {
        color: white;
        font-family: GilroyMedium;
      }
    }

    .aph-select {
      margin: $space 0;
    }

    .amount {
      position: relative;
      margin-top: $space;

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
        color: white;
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
        color: $purple;
      }
      .value {
        font-family: GilroySemibold;
        font-size: toRem(12px);
        margin-left: $space-sm;
        color: white;
      }
    }

    .token, .currency {
      margin-bottom: $space-lg;
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
    width: toRem(500px);
    margin: $space auto;

    > * {
      flex: 1;
    }

    .cancel-btn, .back-btn {
      @extend %btn-footer-light;

      border-bottom-left-radius: $border-radius;
    }

    .next-btn, .send-btn {
      @extend %btn;

      border-bottom-right-radius: $border-radius;
    }
  }
  
  .disclaimer {
    padding: 0 $space-lg 0 $space-lg;
    margin: $space;
    text-align: center;
    color: white;
    
    h2 {
      color: $purple;
      font-size: toRem(14px);
    }
    p {
      font-size: toRem(12px);
      padding: 0;
      margin: $space-sm;
    }
    input, label {
      cursor: pointer;
      margin: $space 0;
    }
  }
}
</style>


