<template>
  <section id="dashboard--send">
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
            <div class="value">{{ $formatMoney(currency ? currency.unitValue * amount : 0) }} {{ $store.state.currency }}</div>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <div class="label">Token</div>
            <div class="value">{{ currency.label }}</div>
          </div>
        </div>
        <div class="row" v-if="this.contact">
          <div class="column">
            <div class="label">Recipient</div>
            <div class="value purple">{{ this.contact.name }}</div>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <div class="label">Address</div>
            <div class="value">{{ address }}</div>
          </div>
        </div>
      </div>
      <div class="waiting" v-if="$store.state.sendInProgress === true">Waiting for transaction to appear on block explorer....</div>
      <div class="footer">
        <button class="back-btn" @click="showConfirmation = false" :disabled="sending">Back</button>
        <button class="send-btn" @click="send()" :disabled="sending">{{ sendButtonLabel }}</button>
      </div>
    </template>
    <template v-else>
      <div class="body">
        <div class="currency">
          <aph-select :options="currencies" :light="true" placeholder="Select a currency" v-model="currency"></aph-select>
        </div>
        <div class="address">
          <aph-input placeholder="Enter Send to Address" v-model="address"></aph-input>
        </div>
        <div class="amount">
          <aph-input placeholder="Enter Amount" v-model="amount"></aph-input>
          <div class="symbol">{{ currency ? currency.value : '' }}</div>
          <div class="max" v-if="currency" @click="setAmountToMax">max</div>
        </div>
        <div class="estimated-value">
          <div class="label">Estimated</div>
          <div class="value">{{ $formatMoney(currency ? currency.unitValue * amount : 0) }} {{ $store.state.currency }}</div>
        </div>
      </div>
      <div class="footer">
        <router-link class="cancel-btn" to="/dashboard">Cancel</router-link>
        <button class="next-btn" @click="next" :disabled="shouldDisableNextButton">Next</button>
      </div>
    </template>
  </section>
</template>

<script>
import { BigNumber } from 'bignumber.js';
import { mapGetters } from 'vuex';
let sendTimeoutIntervalId;
let storeUnwatch;

export default {
  components: {
  },

  computed: {
    currencies() {
      return this.$store.state.holdings.reduce(
        (result, { name, symbol, asset, isNep5, unitValue, balance }) => {
          if (!name || !symbol) {
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

    shouldDisableNextButton() {
      return !this.address || !this.amount || !this.currency || !parseFloat(this.amount);
    },
    ...mapGetters([
      'sendModel',
    ]),
  },

  data() {
    return {
      address: '',
      amount: '',
      contact: null,
      currency: null,
      showConfirmation: false,
      sending: false,
    };
  },

  methods: {
    next() {
      if (!(this.address && this.amount && parseFloat(this.amount) && this.currency)) {
        return;
      }
      this.showConfirmation = true;
    },

    setAmountToMax() {
      if (this.currency) {
        this.amount = this.currency.balance.toString();
      }
    },

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

    send() {
      this.sending = true;

      setTimeout(() => {
        this.$services.neo.sendFunds(this.address, this.currency.asset,
          this.amount, this.currency.isNep5)
          .then(() => {
            this.end();
          })
          .catch((e) => {
            this.sending = false;
            this.$services.alerts.error(e);
            this.$store.commit('setSendInProgress', false);
          });
      }, this.$constants.timeouts.NEO_API_CALL);

      let transactionTimeout = this.$constants.timeouts.TRANSACTION;
      if (this.$services.wallets.getCurrentWallet().isLedger === true) {
        transactionTimeout = this.$constants.timeouts.TRANSACTION_WITH_HARDWARE;
      }

      sendTimeoutIntervalId = setTimeout(() => {
        if (this.sending) {
          this.end();
        }
      }, transactionTimeout);

      this.$router.push('/authenticated/dashboard/confirming');
    },

    end() {
      this.sending = false;
      this.$store.commit('setSendInProgress', false);
      this.address = '';
      this.amount = '';
      this.currency = null;
      this.showConfirmation = false;
      this.$router.push('/authenticated/dashboard');

      if (this.$services.wallets.getCurrentWallet().isLedger === true) {
        this.$services.ledger.close();
      }

      this.$store.dispatch('fetchHoldings', { done: null });
      clearInterval(sendTimeoutIntervalId);
    },
  },

  watch: {
    address() {
      this.contact = this.$services.contacts.findContactByAddress(this.address);
    },

    currency() {
      this.cleanAmount();
    },

    amount() {
      this.cleanAmount();
    },
  },

  mounted() {
    if (this.$store.state.sendInProgress) {
      this.address = this.sendModel.address;
      this.amount = this.sendModel.amount;
      this.contact = this.sendModel.contact;
      this.currency = this.sendModel.currency;
      this.showConfirmation = this.sendModel.showConfirmation;
      this.sending = this.sendModel.sending;
    }

    storeUnwatch = this.$store.watch(
      () => {
        return this.$store.state.sendInProgress;
      }, (sendInProgress) => {
        this.$store.commit('setSendModel', !sendInProgress ? {} : {
          address: this.address,
          amount: this.amount,
          contact: this.contact,
          currency: this.currency,
          showConfirmation: this.showConfirmation,
          sending: this.sending,
        });

        if (sendInProgress === false && this.sending === true) {
          this.end();
        }
      });
  },

  beforeDestroy() {
    storeUnwatch();
  },
};
</script>


<style lang="scss">
#dashboard--send {
  @extend %tile-light;

  box-shadow: $box-shadow;
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    flex: none;
    padding: $space-lg;

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

    .aph-input {
      border-color: $background;
      padding-left: toRem(16px);

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
      margin-top: $space-lg;
      padding-left: toRem(16px);

      .label {
        @extend %small-uppercase-grey-label;
      }
      .value {
        color: $darker-grey;
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
        margin-top: $space-lg;
      }
    }
  }

  .waiting {
    border-top: toRem(1px) solid $border-grey;
    font-family: GilroyMedium;
    padding: $space 0;
    text-align: center;
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
