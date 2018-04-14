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
            <div class="value">{{ $formatNumberBig(amount) }}</div>
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
let sendTimeoutIntervalId;

export default {
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

    send() {
      this.sending = true;

      const self = this;
      setTimeout(() => {
        this.$services.neo.sendFunds(this.address, this.currency.asset,
          this.amount, this.currency.isNep5)
          .then(() => {
            self.sending = false;
            self.address = null;
            self.amount = null;
            self.currency = null;
            self.showConfirmation = false;
            clearTimeout(sendTimeoutIntervalId);
            self.$router.push('/authenticated/dashboard');
            this.$store.dispatch('fetchHoldings');
          })
          .catch((e) => {
            self.sending = false;
            self.$services.alerts.error(e);
          });
      }, this.$constants.timeouts.NEO_API_CALL);

      sendTimeoutIntervalId = setTimeout(() => {
        if (self.sending) {
          self.sending = false;
          self.address = '';
          self.amount = '';
          self.currency = null;
          self.showConfirmation = false;
          self.$router.push('/authenticated/dashboard');
          this.$store.dispatch('fetchHoldings');
        }
      }, 30 * 1000);
    },
  },

  watch: {
    address() {
      this.contact = this.$services.contacts.findContactByAddress(this.address);
    },
  },
};
</script>


<style lang="scss">
#dashboard--send {
  @extend %tile-light;

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
      border-color: $dark;

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

      border-bottom-left-radius: $border-radius;
    }

    .next-btn, .send-btn {
      @extend %btn-footer;

      border-bottom-right-radius: $border-radius;
    }
  }
}
</style>
