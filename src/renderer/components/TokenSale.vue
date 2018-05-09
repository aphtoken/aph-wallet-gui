<template>
  <section id="token-sale">
    <div class="intro-illustration">
      <div class="circles-illustration">
        <img class="icon-circle icon-circle-3" src="~@/assets/img/circle-3.svg" />
        <img class="icon-circle icon-circle-2" src="~@/assets/img/circle-2.svg" />
        <img class="icon-circle icon-circle-1" src="~@/assets/img/circle-1.svg" />
      </div>
    </div>
    <div class="header">
      <h1 class="underlined">Participate in an Initial Coin Offering (ICO)</h1>
    </div>
    <div class="body">
      <div class="token">
        <aph-select :options="tokens" placeholder="Select ICO" v-model="token"></aph-select>
      </div>
      <div class="custom" v-if="token && token.symbol === 'Custom'">
        <aph-input placeholder="Enter the ICO Script Hash" v-model="scriptHash"></aph-input>
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
      scriptHash: '',
      amount: '',
      currency: null,
      agreed: false,
      sending: false,
    };
  },

  computed: {
    tokens() {
      const list = this.$services.tokens.getAllAsArray().reduce(
        (result, { symbol, assetId, network, sale }) => {
          if (!sale || network !== this.$services.network.getSelectedNetwork().net
              || moment(sale.endDate) < moment().utc) {
            return result;
          }

          result.push({
            label: symbol,
            value: {
              symbol,
              assetId,
              sale,
            },
          });

          return result;
        }, []);

      list.push({
        label: 'Use an ICO Script Hash',
        value: {
          symbol: 'Custom',
          assetId: '',
          sale: {
            acceptsNeo: true,
            acceptsGas: true,
          },
        },
      });

      return list;
    },

    currencies() {
      return this.$store.state.holdings.reduce(
        (result, { name, symbol, asset, isNep5, unitValue, balance }) => {
          if (!name || !symbol || isNep5 === true) {
            return result;
          }

          if (this.token) {
            if (symbol === 'NEO' && this.token.sale.acceptsNeo !== true) {
              return result;
            }
            if (symbol === 'GAS' && this.token.sale.acceptsGas !== true) {
              return result;
            }
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

      let icoScriptHash = this.scriptHash.replace('0x', '');
      if (this.token && this.token.symbol !== 'Custom') {
        icoScriptHash = this.token.assetId;
      }

      if (icoScriptHash.length !== 40) {
        this.$services.alerts.error('Please enter a valid ICO script hash');
        this.sending = false;
        return;
      }

      this.$services.neo.participateInTokenSale(icoScriptHash,
        this.currency.asset, this.amount)
        .then((res) => {
          console.log(res);
          this.sending = false;
        })
        .catch((e) => {
          console.log(e);
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
  position: relative;

  .header {
    color: $purple;
    margin-top: toRem(200px);
    text-align: center;
    font-family: GilroySemibold;
    padding: $space;
    
    h1.underlined {
      @extend %underlined-header;
      margin-top: $space-lg;

      flex: 1;
      margin-bottom: 0;
      font-size: toRem(30px);
      
      &:after {
        background: white;
        width: toRem(200px);
        margin: $space-lg auto 0 auto;
      }
    }
  }

  
  .body {
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

    .amount, .custom {
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

    .custom {
      margin: 0 0 $space 0;
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

    .currency {
      margin-top: $space-lg;
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

    .send-btn {
      @extend %btn-outline;

      border-bottom-right-radius: $border-radius;
    }
  }
  
  .none-open {
    padding: 0 $space-lg 0 $space-lg;
    margin: $space;
    text-align: center;
    color: white;
    
    h2 {
      color: $purple;
      font-size: toRem(18px);
      margin-top: $space-lg * 2;
    }
    p {
      font-size: toRem(16px);
      padding: 0;
      margin: $space-sm;
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
  
  .intro-illustration {
    position: absolute;
    width: 100%;
    height: toRem(850px);
    margin-top: toRem(-675px);
    
    .circles-illustration {
      position: relative;
      width: toRem(850px);
      height: toRem(850px);
      margin: 0 auto;
      
      .icon-circle {
        margin: 0 auto;
        position: absolute;
        
        &.icon-circle-2 {
          width: toRem(850px);
          height: toRem(850px);
          top: toRem(10px);
        }
        &.icon-circle-1 {
          width: toRem(720px);
          height: toRem(720px);
          left: toRem(60px);
          top: toRem(10px);
        }
        &.icon-circle-3 {
          width: toRem(780px);
          height: toRem(780px);
          left: toRem(32px);
          top: toRem(28px);
        }
      }
    }
  }
}
</style>


