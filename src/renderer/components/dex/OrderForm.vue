<template>
  <div>
    <section id="dex--orderform">
      <div class="body" v-if="$store.state.currentMarket">
        <div class="balance" :title="quoteBalanceToolTip">
          <div class="label">BALANCE ({{ $store.state.currentMarket.quoteCurrency }})</div>
          <div class="value">{{ $formatNumber(quoteHolding.totalBalance) }}</div>
        </div>
        <div class="balance" :title="baseBalanceToolTip">
          <div class="label">BALANCE ({{ $store.state.currentMarket.baseCurrency }})</div>
          <div class="value">{{ $formatNumber(baseHolding.totalBalance) }}</div>
        </div>
        <div class="balance" :title="aphBalanceToolTip">
          <div class="label">BALANCE (APH)</div>
          <div class="value">{{ $formatNumber(aphHolding.totalBalance) }}</div>
        </div>

        <div class="side">
          <div @click="setSide('Buy')" :class="['buy-btn', {selected: side === 'Buy'}]">Buy</div>
          <div @click="setSide('Sell')" :class="['sell-btn', {selected: side === 'Sell'}]">Sell</div>
        </div>
        <div class="orderType">
          <aph-select :light="true" :options="orderTypes" v-model="orderType"></aph-select>
        </div>
        <div class="price" v-if="orderType === 'Limit'">
          <aph-input :placeholder="priceLabel" v-model="$store.state.orderPrice"></aph-input>
        </div>
        <div class="quantity">
          <aph-input :placeholder="amountLabel" v-model="$store.state.orderQuantity"></aph-input>
        </div>
        <div class="percentages">
          <div @click="setPercent(.25)" :class="['percent-btn', {selected: selectedPercent === .25}]">25%</div>
          <div @click="setPercent(.50)" :class="['percent-btn', {selected: selectedPercent === .50}]">50%</div>
          <div @click="setPercent(.75)" :class="['percent-btn', {selected: selectedPercent === .75}]">75%</div>
          <div @click="setPercent(1)" :class="['percent-btn', {selected: selectedPercent === 1}]">100%</div>
        </div>
        <div class="options">
          <div class="option" v-if="orderType === 'Limit'">
            <input type="checkbox" id="post-only" v-model="postOnly" />
            <label for="post-only">Post Only</label>
          </div>
        </div>       
      </div>
      <div class="footer">
        <div class="estimate">
          <div class="label">ESTIMATE ({{ $store.state.currentMarket.baseCurrency }})</div>
          <div class="value">{{ $formatTokenAmount(estimate) }}</div>
        </div>
        <button @click="confirmOrder" :disabled="shouldDisableOrderButton"
              :class="['order-btn', { 'buy-btn': side === 'Buy', 'sell-btn': side === 'Sell'}]">
          {{ orderButtonLabel }}
        </button>
        <div v-if="baseHolding.symbol != '' && quoteHolding.symbol != ''" class="test-buttons">
          <div class="row">
            <button @click="showDepositWithdrawModal(true, baseHolding)" class="test-btn">Deposit {{ baseHolding.symbol }}</button>
            <button @click="showDepositWithdrawModal(false, baseHolding)" class="test-btn">Withdraw {{ baseHolding.symbol }}</button>
          </div>
          <div class="row">
            <button @click="showDepositWithdrawModal(true, quoteHolding)" class="test-btn">Deposit {{ quoteHolding.symbol }}</button>
            <button @click="showDepositWithdrawModal(false, quoteHolding)" class="test-btn">Withdraw {{ quoteHolding.symbol }}</button>
          </div>
          <div class="row" v-if="quoteHolding.symbol !== 'APH'">
            <button @click="showDepositWithdrawModal(true, aphHolding)" class="test-btn">Deposit APH</button>
            <button @click="showDepositWithdrawModal(false, aphHolding)" class="test-btn">Withdraw APH</button>
            <!-- Only the contract owner or manager can do this.
            <button @click="setMarket" class="test-btn">Setup Market</button> -->
          </div>
        </div>
      </div>
    </section>
    <aph-order-confirmation-modal v-if="$store.state.showOrderConfirmationModal"
      :onConfirmed="orderConfirmed" :onCancel="hideOrderConfirmationModal"></aph-order-confirmation-modal>
    <aph-deposit-withdraw-modal v-if="$store.state.depositWithdrawModalModel"
      :onConfirmed="depositWithdrawConfirmed" :onCancel="hideDepositWithdrawModal"></aph-deposit-withdraw-modal>
  </div>
</template>

<script>
import { BigNumber } from 'bignumber.js';
import AphOrderConfirmationModal from '../modals/OrderConfirmationModal';
import AphDepositWithdrawModal from '../modals/DepositWithdrawModal';

let loadHoldingsIntervalId;

export default {
  components: {
    AphOrderConfirmationModal,
    AphDepositWithdrawModal,
  },

  mounted() {
    this.loadHoldings();

    loadHoldingsIntervalId = setInterval(() => {
      this.loadHoldings();
    }, this.$constants.intervals.HOLDINGS_POLLING);
  },

  beforeDestroy() {
    clearInterval(loadHoldingsIntervalId);
  },

  computed: {
    isOutOfDate() {
      return this.$store.state.latestVersion && this.$store.state.latestVersion.testExchangeScriptHash
        && this.$store.state.latestVersion.testExchangeScriptHash.replace('0x', '')
          !== this.$constants.assets.DEX_SCRIPT_HASH;
    },

    quoteHolding() {
      if (this.$store.state.currentMarket && this.$store.state.holdings) {
        const holding = _.find(this.$store.state.holdings, (o) => {
          return o.asset === this.$store.state.currentMarket.quoteAssetId;
        });

        if (holding) {
          return holding;
        }
      }

      return {
        symbol: this.$store.state.currentMarket ? this.$store.state.currentMarket.quoteCurrency : '',
        balance: 0,
        totalBalance: 0,
        contractBalance: 0,
      };
    },
    baseHolding() {
      if (this.$store.state.currentMarket && this.$store.state.holdings) {
        const holding = _.find(this.$store.state.holdings, (o) => {
          return o.asset === this.$store.state.currentMarket.baseAssetId;
        });

        if (holding) {
          return holding;
        }
      }

      return {
        symbol: this.$store.state.currentMarket ? this.$store.state.currentMarket.baseCurrency : '',
        balance: 0,
        totalBalance: 0,
        contractBalance: 0,
      };
    },
    aphHolding() {
      if (this.$store.state.currentMarket && this.$store.state.holdings) {
        const holding = _.find(this.$store.state.holdings, (o) => {
          return o.asset === this.$constants.assets.APH;
        });

        if (holding) {
          return holding;
        }
      }

      return {
        symbol: 'APH',
        balance: 0,
        totalBalance: 0,
        contractBalance: 0,
      };
    },
    quoteBalanceToolTip() {
      try {
        const walletBalance = this.quoteHolding.balance
          ? this.$formatNumber(this.quoteHolding.balance) : '0';
        const contractBalance = this.quoteHolding.contractBalance
          ? this.$formatNumber(this.quoteHolding.contractBalance) : '0';
        return `Wallet Balance: ${walletBalance}\nContract Balance: ${contractBalance}`;
      } catch (e) {
        return '';
      }
    },
    baseBalanceToolTip() {
      try {
        const walletBalance = this.baseHolding.balance
          ? this.$formatNumber(this.baseHolding.balance) : '0';
        const contractBalance = this.baseHolding.contractBalance
          ? this.$formatNumber(this.baseHolding.contractBalance) : '0';
        return `Wallet Balance: ${walletBalance}\nContract Balance: ${contractBalance}`;
      } catch (e) {
        return '';
      }
    },
    aphBalanceToolTip() {
      try {
        const walletBalance = this.aphHolding.balance
          ? this.$formatNumber(this.aphHolding.balance) : '0';
        const contractBalance = this.aphHolding.contractBalance
          ? this.$formatNumber(this.aphHolding.contractBalance) : '0';
        return `Wallet Balance: ${walletBalance}\nContract Balance: ${contractBalance}`;
      } catch (e) {
        return '';
      }
    },
    priceLabel() {
      return `Price (${this.$store.state.currentMarket.baseCurrency})`;
    },
    amountLabel() {
      return `Amount (${this.$store.state.currentMarket.quoteCurrency})`;
    },
    estimate() {
      try {
        if (!this.$store.state.orderQuantity) {
          return 0;
        }

        let price = this.$store.state.orderPrice;
        if (!price) {
          // market order
          price = this.marketPriceForQuantity(this.side, this.$store.state.orderQuantity);
        }

        return new BigNumber(price).multipliedBy(new BigNumber(this.$store.state.orderQuantity));
      } catch (e) {
        console.log(e);
        return 0;
      }
    },
    orderButtonLabel() {
      return this.$isPending('placeOrder') === false ? `Place ${this.side} Order` : 'Placing Order...';
    },
    shouldDisableOrderButton() {
      if (this.isOutOfDate) {
        return true;
      }
      if (this.orderType === 'Market') {
        return !this.$store.state.orderQuantity || this.$isPending('placeOrder');
      }
      return !this.$store.state.orderQuantity || !this.$store.state.orderPrice || this.$isPending('placeOrder');
    },
  },

  data() {
    return {
      side: 'Buy',
      orderTypes: [{
        label: 'Market',
        value: 'Market',
      },
      {
        label: 'Limit',
        value: 'Limit',
      },
      ],
      orderType: 'Limit',
      postOnly: false,
      selectedPercent: null,
    };
  },

  watch: {
    orderType() {
      if (this.orderType === 'Market') {
        this.$store.commit('setOrderPrice', '');
      }
    },
    quantity() {
      if (this.selectedPercent && this.percent(this.selectedPercent) !== this.$store.state.orderQuantity) {
        this.selectedPercent = null;
      }
    },
  },

  methods: {
    loadHoldings() {
      this.$store.dispatch('fetchHoldings', { done: null });
    },

    setSide(side) {
      this.side = side;
      this.$store.commit('setOrderQuantity', '');
    },

    setPercent(value) {
      if (this.orderType === 'Limit' && !this.$store.state.orderPrice) {
        this.$services.alerts.error('Please enter a price first.');
        return;
      }

      this.$store.commit('setOrderQuantity', this.percent(value));
      this.selectedPercent = value;
    },

    percent(value) {
      let unitPrice = this.$store.state.orderPrice;
      if (this.orderType !== 'Limit') {
        // todo, make smarter to calculate price based on depth of book
        if (this.side === 'Buy') {
          unitPrice = this.$store.state.orderBook.asks[0].price;
        } else if (this.side === 'Sell') {
          unitPrice = this.$store.state.orderBook.bids[0].price;
        }
      }

      let newQuantity = 0;
      if (this.side === 'Buy') {
        newQuantity = (this.baseHolding.totalBalance / unitPrice) * value;
      } else if (this.side === 'Sell') {
        newQuantity = this.quoteHolding.totalBalance * value;
      }

      newQuantity = Math.floor(newQuantity * 100000000) / 100000000.0;
      return newQuantity.toString();
    },

    marketPriceForQuantity(side, quantity) {
      let quantityRemaining = new BigNumber(quantity);
      let totalMultiple = new BigNumber(0);
      let book = this.$store.state.orderBook.asks;

      if (side === 'Sell') {
        book = this.$store.state.orderBook.bids;
      }

      book.forEach((l) => {
        const takeQuantity = l.quantity.isGreaterThan(quantityRemaining) ? quantityRemaining : l.quantity;
        quantityRemaining -= takeQuantity;
        totalMultiple = totalMultiple.plus(takeQuantity * l.price);
      });

      return (totalMultiple / quantity).toString();
    },

    confirmOrder() {
      if (this.orderType === 'Market') {
        this.$store.commit('setOrderPrice', '');
      }

      this.$store.dispatch('formOrder', {
        order: {
          market: this.$store.state.currentMarket,
          side: this.side,
          orderType: this.orderType,
          quantity: new BigNumber(this.$store.state.orderQuantity),
          price: this.$store.state.orderPrice !== '' ? new BigNumber(this.$store.state.orderPrice) : null,
          postOnly: this.postOnly,
        },
      });
    },

    orderConfirmed() {
      if (this.$isPending('placeOrder')) {
        return;
      }

      this.$store.dispatch('placeOrder', {
        order: this.$store.state.orderToConfirm,
        done: () => {
          this.$store.commit('setOrderQuantity', '');
        },
      });
    },
    showDepositWithdrawModal(isDeposit, holding) {
      this.$store.commit('setDepositWithdrawModalModel', {
        isDeposit, holding,
      });
    },
    hideDepositWithdrawModal() {
      this.$store.commit('setDepositWithdrawModalModel', null);
    },
    depositWithdrawConfirmed(isDeposit, holding, amount) {
      this.$services.dex[isDeposit ? 'depositAsset' : 'withdrawAsset'](holding.asset, Number(amount))
        .then(() => {
          this.$services.alerts.success(
            `${amount} ${holding.symbol} ${isDeposit ? 'Deposit' : 'Withdraw'} Relayed to Network.`);
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });

      this.hideDepositWithdrawModal();
    },
    hideOrderConfirmationModal() {
      this.$store.commit('setOrderToConfirm', null);
    },
    setMarket() {
      this.$services.dex.setMarket(this.$constants.assets.APH,
        this.$constants.assets.GAS,
        10, 0.00001, 0.0000, 0.0001)
        .then(() => {
          this.$services.alerts.success('setMarket Invocation Relayed');
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
    },
  },
};
</script>

<style lang="scss">
#dex .grid--cell > div:first-child {
  height:100%;
}
#dex--orderform {
  @extend %tile-light; 
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: toRem(280px);
  height: 100%;
  justify-content: space-between;

  .body {
    overflow: auto;
    
    .side {
      display: flex;
      margin-top: $space;

      .buy-btn, .sell-btn {
        @extend %btn-outline;
        @extend %selected-text;

        flex: 1;
        font-family: GilroySemibold;

        &:disabled {
          border-color: $grey;
        }
      }

      .buy-btn {
        border-color: $green;
        margin-right: $space-sm;

        &:hover, &.selected {
          background-color: $green;
        }
      }

      .sell-btn {
        border-color: $red;
        margin-left: $space-sm;

        &:hover, &.selected {
          background-color: $red;
        }
      }
    }

    .orderType {
      margin: $space 0;
    }

    .percentages {
      display: flex;
      flex-direction: row;
      justify-content: space-between;

      .percent-btn {
        flex: none;
        cursor: pointer;
        font-family: GilroyMedium;
        color: $grey;
        text-align: center;

        &:hover {
          color: $purple;
        }

        &.selected {
          color: $purple;
        }
      }
    }

    .aph-input {
      border-color: $background;
      padding-left: toRem(16px);
      margin-bottom: $space;

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

    .options {
      color: $grey;
      text-align: center;
      margin: $space 0 $space;
    }
  }

  .body, .footer {
    padding: $space;
  }

  .footer {
    margin-top: $space;

    .order-btn {
      margin: $space 0;
    }

    .order-btn, .test-btn {
      @extend %btn-outline;
      @extend %selected-text;
      font-family: GilroySemibold;

      &:disabled {
        color: $grey;
      }
      &.buy-btn {
        border-color: $green;

        &:hover, &.selected {
          background-color: $green;
        }
      }
      &.sell-btn {
        border-color: $red;

        &:hover, &.selected {
          background-color: $red;
        }
      }
    }

    .test-buttons {
      height: auto;
      width: 100%;
      .row {
        display: flex;
        flex-direction: row;

        & + .row {
          margin-top: $space-xs;
        }
      }

      .test-btn {
        height: toRem(26px);
        padding: $space-xs 0;
        font-size: toRem(12px);
        border-width: $border-width-thin;

        & + .test-btn {
          margin-left: $space;
        }
      }
    }
  }

  .balance, .estimate {
    display: flex;
    flex-direction: row;
    align-items: center;

    .label {
      @extend %small-uppercase-grey-label-dark;

      flex: none
    }

    .value {
      flex: 1;
      font-family: GilroySemibold;
      font-size: toRem(12px);
      text-align: right;
    }

    & + .balance {
      margin-top: $space;
    }
  }
}
</style>


