<template>
  <section id="dashboard--send">
    <div class="header">
      <h2 class="underlined">{{$t('send')}}</h2>
    </div>
    <template v-if="showConfirmation">
      <div class="body">
        <div class="row">
          <div class="column">
            <div class="label">{{$t('amount')}}</div>
            <div class="value">{{ $formatNumber(amount) }}</div>
          </div>
          <div class="column">
            <div class="label">{{$t('value')}}</div>
            <div class="value">{{ $formatMoney(currency ? currency.unitValue * amount : 0) }} {{ $store.state.currency }}</div>
          </div>
          <div class="column" v-if="currentNetwork.fee > 0">
            <div class="label">{{$t('networkFee')}}</div>
            <div class="value">{{ $formatNumber(currentNetwork.fee) }}</div>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <div class="label">{{$t('token')}}</div>
            <div class="value">{{ currency.label }}</div>
          </div>
        </div>
        <div class="row" v-if="this.contact">
          <div class="column">
            <div class="label">{{$t('recipient')}}</div>
            <div class="value purple">{{ this.contact.name }}</div>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <div class="label">{{$t('address')}}</div>
            <div class="value">{{ address }}</div>
          </div>
        </div>
      </div>
      <div class="waiting" v-if="sendInProgress">{{$t('waitingForTransaction')}}</div>
      <div class="footer">
        <button class="back-btn" @click="showConfirmation = false" :disabled="sending">{{$t('back')}}</button>
        <button class="send-btn" @click="send" :disabled="sending">{{ sendButtonLabel }}</button>
      </div>
    </template>
    <template v-else>
      <div class="body">
        <aph-form :on-submit="next">
          <div class="currency">
            <aph-select :options="currencies" :light="true" :placeholder="$t('selectCurrency')" v-model="currency"></aph-select>
          </div>
          <div class="address">
            <aph-input :placeholder="$t('enterSendToAddress')" v-model="address"></aph-input>
          </div>
          <div class="amount">
            <aph-input :isNumeric="true" @blur="amount = $cleanAmount(amount, currency)" :placeholder="$t('enterAmount')" v-model="amount"></aph-input>
            <div class="symbol">{{ currency ? currency.value : '' }}</div>
            <div class="max" v-if="currency" @click="setAmountToMax">{{$t('max')}}</div>
          </div>
          <div class="estimated-value">
            <div class="label">{{$t('estimated')}}</div>
            <div class="value">{{ $formatMoney(currency ? currency.unitValue * amount : 0) }} {{ $store.state.currency }}</div>
          </div>
          <div class="network-fee" v-if="currentNetwork.fee > 0">
            <div class="label">{{$t('networkFee')}}</div>
            <div class="value">{{ $formatNumber(currentNetwork.fee) }} GAS</div>
          </div>
        </aph-form>
      </div>
      <div class="footer">
        <router-link class="cancel-btn" to="/dashboard">{{$t('cancel')}}</router-link>
        <button class="next-btn" @click="next" :disabled="shouldDisableNextButton">{{$t('next')}}</button>
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
        (result, { name, symbol, assetId, isNep5, unitValue, balance, decimals }) => {
          if (!name || !symbol) {
            return result;
          }

          result.push({
            label: `${name} (${this.$formatNumber(balance)})`,
            value: {
              symbol,
              name,
              assetId,
              isNep5,
              label: `${name} (${balance})`,
              unitValue,
              balance,
              decimals,
            },
            assetId,
            isNep5,
            unitValue,
          });

          return result;
        }, []);
    },

    currentNetwork() {
      return this.$services.network.getSelectedNetwork();
    },

    sendButtonLabel() {
      return this.sending ? this.$t('waitingForConfirmation') : this.$t('send');
    },

    shouldDisableNextButton() {
      return !this.address || !this.amount || !this.currency || !parseFloat(this.amount);
    },
    ...mapGetters([
      'sendInProgress',
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
        if (this.currency.symbol === 'GAS') {
          this.amount = new BigNumber(this.amount).minus(this.currentNetwork.fee).toString();
        }
      }
    },

    send() {
      if (new BigNumber(this.amount).isGreaterThan(this.currency.balance)) {
        this.$services.alerts
          .exception(`Insufficient ${this.currency.symbol}!` +
            ` Need ${this.amount} but only found ${this.currency.balance}`);
        return;
      }

      this.sending = true;

      setTimeout(() => {
        this.$services.neo.sendFunds(this.address, this.currency.assetId,
          this.amount, this.currency.isNep5, null, true)
          .then(() => {
            this.end();
          })
          .catch((e) => {
            this.sending = false;
            this.$services.alerts.exception(e);
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

      this.$store.dispatch('fetchHoldings');
      clearInterval(sendTimeoutIntervalId);
    },
  },

  watch: {
    address() {
      this.contact = this.$services.contacts.findContactByAddress(this.address);
    },
  },

  mounted() {
    if (this.sendInProgress) {
      this.address = this.sendModel.address;
      this.amount = this.sendModel.amount;
      this.contact = this.sendModel.contact;
      this.currency = this.sendModel.currency;
      this.showConfirmation = this.sendModel.showConfirmation;
      this.sending = this.sendModel.sending;
    }

    storeUnwatch = this.$store.watch(
      (state, getters) => {
        return getters.sendInProgress;
      }, (sendInProgress) => {
        this.$store.commit('setSendModel', !sendInProgress ? {} : {
          address: this.address,
          amount: this.amount,
          contact: this.contact,
          currency: this.currency,
          showConfirmation: this.showConfirmation,
          sending: this.sending,
        });

        if (!sendInProgress && this.sending) {
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
  margin: $space;

  .header {
    flex: none;
    padding: $space $space-lg;
    font-size: toRem(10px);
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
        font-family: ProximaMedium;
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

    .estimated-value, .network-fee {
      display: flex;
      margin-top: $space-lg;
      padding-left: toRem(16px);

      .label {
        @extend %small-uppercase-grey-label;
      }
      .value {
        color: $darker-grey;
        font-family: ProximaSemibold;
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
          font-family: ProximaSemibold;
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
    font-family: ProximaMedium;
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
