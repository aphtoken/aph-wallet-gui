<template>
  <div>
    <section id="dex--order-form">
      <div class="body">
        <div class="balance" :title="quoteBalanceToolTip">
          <div class="label">{{$t('balance')}} ({{ $store.state.currentMarket ? $store.state.currentMarket.quoteCurrency : '' }})</div>
          <div class="value">{{ $formatNumber(quoteHolding.totalBalance) }}</div>
        </div>
        <div class="balance" :title="baseBalanceToolTip">
          <div class="label">{{$t('balance')}} ({{ $store.state.currentMarket ? $store.state.currentMarket.baseCurrency : '' }})</div>
          <div class="value">{{ $formatNumber(baseHolding.totalBalance) }}</div>
        </div>
        <div class="balance" :title="aphBalanceToolTip" v-if="quoteHolding.symbol !== 'APH'">
          <div class="label">{{$t('balance')}} (APH)</div>
          <div class="value">{{ $formatNumber(aphHolding.totalBalance) }}</div>
        </div>
        <div class="side">
          <div @click="setSide('Buy')" :class="['buy-btn', {selected: side === 'Buy'}]">{{$t('buy')}}</div>
          <div @click="setSide('Sell')" :class="['sell-btn', {selected: side === 'Sell'}]">{{$t('sell')}}</div>
        </div>
        <div class="order-type">
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
            <label for="post-only">{{$t('postOnly')}}</label>
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="total">
          <div class="label">{{$t('total')}} ({{ baseHolding.symbol }})</div>
          <div class="value">{{ $formatNumber(total) }}</div>
        </div>
        <div class="estimate">
          <div class="label">{{$t('estimate')}} ({{ $services.settings.getCurrency() }})</div>
          <div class="value">{{ $formatMoney(estimate) }}</div>
        </div>
        <button @click="confirmOrder" :disabled="shouldDisableOrderButton"
              :class="['order-btn', { 'buy-btn': side === 'Buy', 'sell-btn': side === 'Sell'}]">
          {{ orderButtonLabel }}
        </button>
        <div class="test-buttons">
          <div class="row">
            <button @click="showDepositWithdrawModal(true, baseHolding)" class="test-btn">{{ $t('deposit') }} {{ baseHolding.symbol }}</button>
            <button @click="showDepositWithdrawModal(false, baseHolding)" class="test-btn">{{$t('withdraw')}} {{ baseHolding.symbol }}</button>
          </div>
          <div class="row">
            <button @click="showDepositWithdrawModal(true, quoteHolding)" class="test-btn">{{$t('deposit')}} {{ quoteHolding.symbol }}</button>
            <button @click="showDepositWithdrawModal(false, quoteHolding)" class="test-btn">{{$t('withdraw')}} {{ quoteHolding.symbol }}</button>
          </div>
          <div class="row" v-if="quoteHolding.symbol !== 'APH'">
            <button @click="showDepositWithdrawModal(true, aphHolding)" class="test-btn">{{$t('depositAPH')}}</button>
            <button @click="showDepositWithdrawModal(false, aphHolding)" class="test-btn">{{$t('withdrawAPH')}}</button>
          </div>
          <!-- Only the contract owner or manager can do this.
          <button @click="setMarket" class="test-btn">Setup Market</button>-->
        </div>
        <!-- Only the contract owner or manager can do this.
            <button @click="setMarket" class="test-btn">Setup Market</button> -->
      </div>
    </section>
    <aph-order-confirmation-modal v-if="$store.state.showOrderConfirmationModal"
      :onConfirmed="orderConfirmed" :onCancel="hideOrderConfirmationModal"></aph-order-confirmation-modal>
    <aph-deposit-withdraw-modal v-if="$store.state.depositWithdrawModalModel"
      :onConfirmed="depositWithdrawConfirmed" :onCancel="hideDepositWithdrawModal"></aph-deposit-withdraw-modal>
    <aph-loader v-if="!$store.state.holdings.length" identifier="fetchHoldings"></aph-loader>
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

  created() {
    this.loadHoldings();

    loadHoldingsIntervalId = setInterval(() => {
      this.loadHoldings(true);
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
        openOrdersBalance: 0,
      };
    },
    quoteBalanceToolTip() {
      try {
        const walletBalance = this.quoteHolding.balance
          ? this.$formatNumber(this.quoteHolding.balance) : '0';
        const contractBalance = this.quoteHolding.contractBalance
          ? this.$formatNumber(this.quoteHolding.contractBalance) : '0';
        const openOrdersBalance = this.quoteHolding.openOrdersBalance
          ? this.$formatNumber(this.quoteHolding.openOrdersBalance) : '0';
        return this.$t('walletBalanceContractBalance', { walletBalance, contractBalance, openOrdersBalance });
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
        const openOrdersBalance = this.baseHolding.openOrdersBalance
          ? this.$formatNumber(this.baseHolding.openOrdersBalance) : '0';
        return this.$t('walletBalanceContractBalance', { walletBalance, contractBalance, openOrdersBalance });
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
        const openOrdersBalance = this.aphHolding.openOrdersBalance
          ? this.$formatNumber(this.aphHolding.openOrdersBalance) : '0';
        return this.$t('walletBalanceContractBalance', { walletBalance, contractBalance, openOrdersBalance });
      } catch (e) {
        return '';
      }
    },
    priceLabel() {
      return this.$store.state.currentMarket ?
        this.$t('priceBase', { base: this.$store.state.currentMarket.baseCurrency }) : '';
    },
    amountLabel() {
      return this.$store.state.currentMarket ?
        this.$t('amountQuote', { quote: this.$store.state.currentMarket.quoteCurrency }) : '';
    },
    price() {
      let price = this.$store.state.orderPrice;
      if (!price) {
        // market order
        price = this.marketPriceForQuantity(this.side, this.$store.state.orderQuantity);
      }
      return price;
    },
    total() {
      try {
        if (!this.$store.state.orderQuantity) {
          return 0;
        }

        return new BigNumber(this.price).multipliedBy(new BigNumber(this.$store.state.orderQuantity));
      } catch (e) {
        console.log(e);
        return 0;
      }
    },
    estimate() {
      const holding = this.$store.state.currentMarket && this.$store.state.holdings.length ?
        this.$services.neo.getHolding(this.$store.state.currentMarket.baseAssetId).unitValue :
        0;

      try {
        return new BigNumber(this.total).multipliedBy(
          new BigNumber(holding));
      } catch (e) {
        console.log(e);
        return 0;
      }
    },
    orderButtonLabel() {
      return this.$isPending('placeOrder') === false ?
        this.$t('placeSideOrder', { side: this.side }) :
        this.$t('placingOrder');
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
    loadHoldings(isRequestSilent = false) {
      this.$store.dispatch('fetchHoldings', { done: null, isRequestSilent });
    },

    setSide(side) {
      this.side = side;
      this.$store.commit('setOrderQuantity', '');
    },

    setPercent(value) {
      if (this.orderType === 'Limit' && !this.$store.state.orderPrice) {
        this.$services.alerts.error(this.$t('pleaseEnterAPrice'));
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
        if (quantityRemaining.isLessThanOrEqualTo(0)) {
          return;
        }
        quantityRemaining = quantityRemaining.minus(takeQuantity);
        totalMultiple = totalMultiple.plus(takeQuantity.multipliedBy(l.price));
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
          const message = this.$t('relayedToNetwork', {
            amount,
            symbol: holding.symbol,
            action: (isDeposit ? this.$t('deposit') : this.$t('withdraw')),
          });
          this.$services.alerts.success(message);
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
          this.$services.alerts.success(this.$t('setMarketRelayed'));
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
    },
  },
};
</script>

<style lang="scss">
[v-cloak] {
  display: none;
}
#dex .grid--cell > div:first-child {
  height: 100%;
}

#dex--order-form {
  @extend %tile-light;

  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  min-width: toRem(280px);
  position: relative;

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

    .order-type {
      margin: $space 0;
    }

    .percentages {
      background: $light-grey;
      border-radius: $border-radius;
      display: flex;
      flex-direction: row;

      .percent-btn {
        @extend %small-uppercase-grey-label-dark;

        cursor: pointer;
        flex: 1;
        padding: $space 0;
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
      margin-bottom: $space;
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

    .options {
      color: $grey;
      margin: $space 0 $space;
      text-align: center;
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
        border-width: $border-width-thin;
        font-size: toRem(12px);
        height: toRem(26px);
        padding: $space-xs 0;

        & + .test-btn {
          margin-left: $space;
        }
      }
    }
  }

  .total {
    margin-bottom: toRem(8px);
  }

  .balance, .estimate, .total {
    align-items: center;
    display: flex;
    flex-direction: row;

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

.Night {
  #dex--order-form {
    .body {
      .percentages {
        background: $background-night;

        .percent-btn {
          @extend %small-uppercase-grey-label;
        }
      }
    }
  }
}
</style>


