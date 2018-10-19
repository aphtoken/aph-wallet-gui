<template>
  <section id="token-sale">
    <div class="intro-illustration">
      <div class="circles">
        <img class="circle circle-sm" src="~@/assets/img/circle-3.svg" />
        <img class="circle circle-md" src="~@/assets/img/circle-2.svg" />
        <img class="circle circle-lg" src="~@/assets/img/circle-1.svg" />
      </div>
    </div>
    <div id="token-sale--scrollable">
      <div class="header">
        <h1 class="underlined">{{ $t('participateInIco') }}</h1>
      </div>
      <div class="body">
        <aph-form :on-submit="send">
          <aph-select :options="tokens" :placeholder="$t('selectIco')" v-model="token"></aph-select>
          <aph-input class="script-hash" :placeholder="$t('enterIcoScriptHash')" v-model="scriptHash" v-if="token && token.symbol === 'Custom'"></aph-input>
          <aph-select :options="currencies" :placeholder="$t('buyWith')" v-model="currency"></aph-select>
          <div class="amount">
            <aph-input placeholder="Enter Amount" v-model="amount"></aph-input>
            <div class="symbol">{{ currency ? currency.value : '' }}</div>
            <div class="max" v-if="currency" @click="setAmountToMax">{{ $t('max') }}</div>
          </div>
          <div class="estimated-value">
            <div class="label">{{ $t('estimatedAmount') }}</div>
            <div class="value">{{ $formatMoney(currency ? currency.unitValue * amount : 0) }} {{ $store.state.currency }}</div>
          </div>
        </aph-form>
      </div>
      <div class="disclaimer">
        <h2>{{ $t('disclaimerUrgent') }}</h2>
        <p>{{ $t('ensureThatYouAreOnlySendingTokens') }}</p>
        <p>{{ $t('submittingMultipleTimesWarning') }}</p>
        <p>{{ $t('aphelionIsNotResponsible') }}</p>
        <div class="disclaimer-accept">
          <input type="checkbox" id="confirm-disclaimer" v-model="agreed" />
          <label for="confirm-disclaimer">{{ $t('iAgree') }}</label>
        </div>
      </div>
      <div class="footer">
        <button class="send-btn" @click="send" :disabled="shouldDisableSendButton">{{ sendButtonLabel }}</button>
      </div>
    </div>
  </section>
</template>

<script>
import moment from 'moment';
import { BigNumber } from 'bignumber.js';
let loadTransactionsIntervalId;

export default {
  beforeDestroy() {
    this.$store.commit('setShowPortfolioHeader', true);
    clearInterval(loadTransactionsIntervalId);
  },

  beforeMount() {
    // This fetch seems redundant with AuthenticatedWrapper periodic fetch, can probably remove it.
    this.$store.dispatch('fetchHoldings');
    this.loadTransactions();

    loadTransactionsIntervalId = setInterval(() => {
      this.loadTransactions();
    }, this.$constants.intervals.TRANSACTIONS_POLLING);
  },

  computed: {
    tokens() {
      const list = this.$services.assets.getNetworkAssetsAsArray().reduce(
        (result, { symbol, name, assetId, network, sale }) => {
          if (!sale || network !== this.$services.network.getSelectedNetwork().net
              || moment(sale.endDate) < moment().utc()) {
            return result;
          }

          result.push({
            label: name ? `${symbol} - ${name}` : symbol,
            value: {
              symbol,
              assetId,
              sale,
            },
          });

          return result;
        }, []);

      list.push({
        label: this.$t('useAnIcoScriptHash'),
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
            if (symbol === 'NEO' && this.token.sale && this.token.sale.acceptsNeo !== true) {
              return result;
            }
            if (symbol === 'GAS' && this.token.sale && this.token.sale.acceptsGas !== true) {
              return result;
            }
          }

          result.push({
            asset,
            isNep5,
            label: `${name} (${this.$formatNumber(balance)})`,
            unitValue,
            value: {
              symbol,
              name,
              asset,
              isNep5,
              label: `${name} (${balance})`,
              unitValue,
              balance,
            },
          });

          return result;
        }, []);
    },

    sendButtonLabel() {
      return this.sending ? this.$t('waitingForConfirmation') : this.$t('purchaseNow');
    },

    shouldDisableSendButton() {
      return !this.token || !this.amount || !this.currency
      || !parseFloat(this.amount) || this.agreed === false || this.sending === true;
    },
  },

  data() {
    return {
      agreed: false,
      amount: '',
      currency: null,
      scriptHash: '',
      sending: false,
      token: null,
    };
  },

  methods: {
    cleanAmount() {
      if (!this.amount) {
        return;
      }

      let cleanAmount = this.amount.replace(/[^\d.]/g, '');

      if (cleanAmount && cleanAmount.length > 0) {
        if (this.currency && this.currency.symbol === 'NEO') {
          const cleanNumber = Math.floor(new BigNumber(cleanAmount).toNumber());
          cleanAmount = new BigNumber(cleanNumber).toFixed(this.holding.decimals);
        } else if (cleanAmount[cleanAmount.length - 1] !== '.'
          && cleanAmount[cleanAmount.length - 1] !== '0') {
          cleanAmount = this.$formatNumber(new BigNumber(cleanAmount), this.$constants.formats.WHOLE_NUMBER_NO_COMMAS);
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
        this.$services.alerts.error(this.$t('pleaseEnterValidScriptHash'));
        this.sending = false;
        return;
      }

      if (this.amount > this.currency.balance) {
        this.$services.alerts.error(this.$t('amountEnteredGreaterThanBalance', { symbol: this.currency.symbol }));
        this.sending = false;
        return;
      }

      this.$services.neo.participateInTokenSale(icoScriptHash,
        this.currency.assetId, this.amount)
        .then((res) => {
          this.$services.alerts.success(
            this.$t('tokenSaleSuccessful', { symbol: res.symbol, balance: res.balance }),
          );
          // TODO: we should add to user assets right away here
          this.$store.dispatch('fetchHoldings');
          this.sending = false;
        })
        .catch((e) => {
          console.log(e);
          this.sending = false;
          this.$services.alerts.error(e);
        });
    },

    loadTransactions() {
      this.$store.dispatch('fetchRecentTransactions');
    },
  },

  mounted() {
    this.$store.commit('setShowPortfolioHeader', false);
  },

  watch: {
    amount() {
      this.cleanAmount();
    },

    currency() {
      this.cleanAmount();
    },
  },

};
</script>

<style lang="scss">
#token-sale {
  align-items: flex-start;
  background-color: $dark-purple;
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow: auto;
  position: relative;

  #token-sale--scrollable {
    align-items: center;
    display: flex;
    flex-direction: column;
    flex: 1;
    margin: auto 0;
    padding: $space-lg 0;

    .header {
      color: $purple;
      flex: none;
      font-family: GilroySemibold;
      text-align: center;
      z-index: 1;

      h1.underlined {
        @extend %underlined-header;

        flex: 1;
        font-size: toRem(30px);
        margin: 0;

        &:after {
          background: white;
          margin: $space-xl auto;
          width: toRem(200px);
        }
      }
    }


    .body {
      flex: none;
      margin: 0 auto;
      text-align: center;
      width: toRem(400px);

      .aph-input {
        .placeholder {
          color: white;
          font-family: GilroyMedium;
        }
      }

      .aph-select, .script-hash {
        margin-bottom: $space-lg;
      }

      .amount {
        position: relative;

        input {
          box-sizing: border-box;
          padding-right: $space-lg;
        }

        .symbol {
          @extend %small-uppercase-grey-label;

          position: absolute;
          right: 0;
          top: toRem(18px);
        }

        .max {
          @include transition(color);

          bottom: toRem(16px);
          color: $grey;
          cursor: pointer;
          font-size: toRem(10px);
          position: absolute;
          right: 0;
          text-transform: uppercase;
          z-index: 0;

          &:hover {
            color: $purple;
          }
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
          color: white;
          font-family: GilroySemibold;
          font-size: toRem(12px);
          margin-left: $space-sm;
        }
      }
    }

    .disclaimer {
      color: white;
      flex: none;
      margin: $space-lg 0 $space-xl;
      text-align: center;
      width: toRem(800px);
      font-size: toRem(12px);

      h2 {
        color: $purple;
        font-size: toRem(14px);
      }

      p {
        color: white;
        margin: 0;

        & + p {
          margin-top: $space-sm;
        }
      }

      .disclaimer-accept {
        cursor: pointer;
        margin-top: $space;

        > label {
          cursor: pointer;
          margin-left: $space-sm;
        }
      }
    }

    .footer {
      display: flex;
      flex-direction: row;
      flex: none;
      width: toRem(400px);

      .send-btn {
        @extend %btn-outline;
      }
    }
  }

  .intro-illustration {
    display: flex;
    justify-content: center;
    position: absolute;
    top: toRem(-500px);
    width: 100%;
    z-index: 0;

    .circles {
      align-items: flex-start;
      display: flex;
      justify-content: center;
      position: relative;
      width: toRem(700px);

      .circle {
        position: absolute;
        &.circle-lg {
          opacity: .6;
          width: 100%;
        }
        &.circle-md {
          width: 92%;
        }
        &.circle-sm {
          width: 80%;
        }
      }
    }
  }
}
</style>


