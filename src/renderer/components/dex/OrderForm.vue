<template>
  <div>
    <section id="dex--order-form">
      <aph-spinner-wrapper :hideCondition="!!$store.state.holdings.length" identifier="fetchHoldings">
        <div class="body">
          <div class="side">
            <div @click="setSide('Buy')" :class="['buy-btn', {selected: side === 'Buy'}]">{{$t('buy')}} {{ quoteHolding.symbol }}</div>
            <div @click="setSide('Sell')" :class="['sell-btn', {selected: side === 'Sell'}]">{{$t('sell')}} {{ quoteHolding.symbol }}</div>
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
            <div @click="postOnly = !postOnly" class="option" v-if="orderType === 'Limit'">
              <label>{{$t('postOnly')}}</label>
              <aph-icon name="radio-on" v-if="postOnly"></aph-icon>
              <aph-icon name="radio-off" v-else></aph-icon>
            </div>
          </div>
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
        </div>
        <div class="footer">
          <div @click="actionableHolding = quoteHolding" :class="['balance', {active: quoteHolding.symbol === actionableHolding.symbol}]" :title="quoteBalanceToolTip">
            <div class="label">{{$t('balance')}} ({{ quoteHolding.symbol }})</div>
            <div class="value">{{ $formatNumber(quoteHolding.totalBalance) }}</div>
          </div>
          <div @click="actionableHolding = baseHolding" :class="['balance', {active: baseHolding.symbol === actionableHolding.symbol}]" :title="baseBalanceToolTip">
            <div class="label">{{$t('balance')}} ({{ baseHolding.symbol }})</div>
            <div class="value">{{ $formatNumber(baseHolding.totalBalance) }}</div>
          </div>
          <div @click="actionableHolding = aphHolding" :class="['balance', {active: aphHolding.symbol === actionableHolding.symbol}]" :title="aphBalanceToolTip" v-if="baseHolding.symbol !== 'APH' && quoteHolding.symbol !== 'APH'">
            <div class="label">{{$t('balance')}} (APH)</div>
            <div class="value">{{ $formatNumber(aphHolding.totalBalance) }}</div>
          </div>
          <div v-if="baseHolding.symbol != '' && quoteHolding.symbol != ''" class="footer-buttons">
            <div class="row">
              <button @click="showDepositWithdrawModal(true)" class="footer-btn">{{$t('deposit')}} {{ actionableHolding.symbol }}</button>
              <button @click="showDepositWithdrawModal(false)" class="footer-btn">{{$t('withdraw')}} {{ actionableHolding.symbol }}</button>
            </div>
          </div>
          <div class="footer-buttons">
          <!-- Only the contract owner or manager can do this.
              <button @click="setMinimumClaimBlocks" class="footer-btn">Set Min Claim Blocks</button>
              <button @click="setMarket" class="footer-btn">Setup Market</button>
              <button @click="claimGasForDexContract" class="footer-btn">Claim DEX Gas</button> -->
          </div>
       </div>
      </aph-spinner-wrapper>
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

const ORDER_TYPES_LIST = [
  {
    label: 'Limit',
    value: 'Limit',
  },
];

let loadHoldingsIntervalId;

export default {
  components: {
    AphOrderConfirmationModal,
    AphDepositWithdrawModal,
  },

  created() {
    this.loadHoldings();

    this.actionableHolding = this.quoteHolding;

    loadHoldingsIntervalId = setInterval(() => {
      this.loadHoldingsSilently();
    }, this.$constants.intervals.HOLDINGS_POLLING);
  },

  beforeDestroy() {
    clearInterval(loadHoldingsIntervalId);
  },

  computed: {
    currentMarket() {
      return this.$store.state.currentMarket;
    },

    isTradingDisabled() {
      return this.isOutOfDate || this.isMarketClosed;
    },

    isOutOfDate() {
      return this.$store.state.latestVersion && this.$store.state.latestVersion.testExchangeScriptHash
        && this.$store.state.latestVersion.testExchangeScriptHash.replace('0x', '')
          !== this.$services.assets.DEX_SCRIPT_HASH;
    },

    isMarketClosed() {
      return this.$store.state.currentMarket && this.$store.state.currentMarket.isOpen === false;
    },

    quoteHolding() {
      if (this.currentMarket && this.$store.state.holdings) {
        const holding = _.find(this.$store.state.holdings, (o) => {
          return o.assetId === this.currentMarket.quoteAssetId;
        });

        if (holding) {
          return holding;
        }
      }

      return {
        symbol: this.currentMarket ? this.currentMarket.quoteCurrency : '',
        balance: 0,
        totalBalance: 0,
        contractBalance: 0,
      };
    },
    baseHolding() {
      if (this.currentMarket && this.$store.state.holdings) {
        const holding = _.find(this.$store.state.holdings, (o) => {
          return o.assetId === this.currentMarket.baseAssetId;
        });

        if (holding) {
          return holding;
        }
      }

      return {
        symbol: this.currentMarket ? this.currentMarket.baseCurrency : '',
        balance: 0,
        totalBalance: 0,
        contractBalance: 0,
      };
    },
    aphHolding() {
      if (this.currentMarket && this.$store.state.holdings) {
        const holding = _.find(this.$store.state.holdings, (o) => {
          return o.assetId === this.$services.assets.APH;
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
      if (!this.currentMarket) {
        return '';
      }

      return this.$t('priceBase', { base: this.currentMarket.baseCurrency });
    },
    amountLabel() {
      if (!this.currentMarket) {
        return '';
      }

      return this.$t('amountQuote', { quote: this.currentMarket.quoteCurrency });
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
      const holding = this.currentMarket ?
        this.$services.neo.getHolding(this.currentMarket.baseAssetId).unitValue :
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
      if (this.isTradingDisabled) {
        return true;
      }
      if (this.orderType === 'Market') {
        return !this.$store.state.orderQuantity || this.$isPending('placeOrder');
      }
      return !this.$store.state.orderQuantity || !this.$store.state.orderPrice || this.$isPending('placeOrder');
    },
    orderTypes() {
      if (this.canPlaceMarketOrder) {
        return _.concat(ORDER_TYPES_LIST, [
          {
            label: 'Market',
            value: 'Market',
          },
        ]);
      }
      return ORDER_TYPES_LIST;
    },
    canPlaceMarketOrder() {
      const currentWallet = this.$services.wallets.getCurrentWallet();
      return currentWallet && currentWallet.isLedger !== true;
    },
  },

  data() {
    return {
      actionableHolding: '',
      side: 'Buy',
      orderType: 'Limit',
      postOnly: false,
      selectedPercent: null,
    };
  },

  watch: {
    currentMarket() {
      this.actionableHolding = this.quoteHolding;
    },

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
    loadHoldingsSilently() {
      this.$store.dispatch('fetchHoldings', { done: null, isRequestSilent: true });
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
        if (this.canPlaceMarketOrder !== true) {
          this.orderType = 'Limit';
          this.$services.alerts.error('Unable to place Market order using a Ledger');
          return;
        }
      }

      this.$store.dispatch('formOrder', {
        order: {
          market: this.currentMarket,
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
    showDepositWithdrawModal(isDeposit) {
      this.$store.commit('setDepositWithdrawModalModel', {
        isDeposit, holdingAssetId: this.actionableHolding.assetId,
      });
    },
    hideDepositWithdrawModal() {
      this.$store.commit('setDepositWithdrawModalModel', null);
    },
    depositWithdrawConfirmed(isDeposit, holding, amount) {
      this.$services.dex[isDeposit ? 'depositAsset' : 'withdrawAsset'](holding.assetId, Number(amount))
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
      this.$services.dex.setMarket(this.$services.assets.APH,
        this.$services.assets.GAS,
        100, 0.00001, 0.0000, 0.25)
        .then(() => {
          this.$services.alerts.success(this.$t('setMarketRelayed'));
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
      this.$services.dex.setMarket(this.$services.assets.ATI,
        this.$services.assets.APH,
        200, 0.00001, 0.25, 0)
        .then(() => {
          this.$services.alerts.success(this.$t('setMarketRelayed'));
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
      this.$services.dex.setMarket(this.$services.assets.NEO,
        this.$services.assets.GAS,
        0.5, 0.000001, 0.30946428, 0.30946428)
        .then(() => {
          this.$services.alerts.success(this.$t('setMarketRelayed'));
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
      this.$services.dex.setMarket(this.$services.assets.ATI,
        this.$services.assets.NEO,
        200, 0.00001, 0.25, 0.25)
        .then(() => {
          this.$services.alerts.success(this.$t('setMarketRelayed'));
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
      this.$services.dex.setMarket(this.$services.assets.ATI,
        this.$services.assets.GAS,
        200, 0.00001, 0.25, 0.25)
        .then(() => {
          this.$services.alerts.success(this.$t('setMarketRelayed'));
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
      this.$services.dex.setMarket(this.$services.assets.APH,
        this.$services.assets.NEO,
        100, 0.0000001, 0, 0.25)
        .then(() => {
          this.$services.alerts.success(this.$t('setMarketRelayed'));
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
      /*
      this.$services.dex.setMarket('9aff1e08aea2048a26a3d2ddbb3df495b932b1e7',
        this.$constants.assets.APH,
        1, 0.00001, 0.01, 0.01)
        .then(() => {
          this.$services.alerts.success(this.$t('setMarketRelayed'));
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
      */
    },
    setMinimumClaimBlocks() {
      this.$services.dex.setMinimumClaimBlocks(180)
        .then(() => {
          this.$services.alerts.success(this.$t('setMinimumClaimBlocks'));
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
    },
    claimGasForDexContract() {
      this.$services.dex.claimGasForDexContract()
        .then(() => {
          this.$services.alerts.success(this.$t('claimGasForDexContract'));
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
  height: 100%;
}

#dex--order-form {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  min-width: toRem(280px);
  overflow: hidden;
  position: relative;

  .body {
    @extend %tile-light;

    flex: 1;
    overflow: auto;

    .side {
      display: flex;

      .buy-btn { 
        margin-right: $space-sm;
      }

      .sell-btn { 
        margin-left: $space-sm;
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
      margin-top: $space;

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

    .order-btn {
      @extend %btn-outline;
      @extend %selected-text;

      font-family: GilroySemibold;
      margin: $space 0 0;

      &:disabled {
        color: $grey;
      }
    }

    .options {
      color: $grey;
      margin: $space 0 $space;

      .option {
        align-items: center;
        cursor: pointer;
        display: flex;
        user-select: none;

        label {
          cursor: pointer;
        }

        .aph-icon {
          margin-left: $space;

          svg {
            height: toRem(20px);
          }

          .fill {
            fill: $dark-grey;
          }
        }
      }
    }

    .buy-btn, .sell-btn {
      @extend %btn-outline;
      @extend %selected-text;

      flex: 1;
      font-family: GilroySemibold;

      &:disabled {
        background: transparent !important;
        border-color: $grey;
      }
    }

    .buy-btn {
      border-color: $green;

      &:hover, &.selected {
        background-color: $green;
      }
    }

    .sell-btn {
      border-color: $red;

      &:hover, &.selected {
        background-color: $red;
      }
    }

    .quantity {
      margin-top: $space-sm;
    }
  }

  .body, .footer {
    padding: $space;
  }

  .footer {
    @extend %tile-light;

    margin-top: $space;

    .footer-btn {
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

    .footer-buttons {
      height: auto;
      width: 100%;

      .row {
        display: flex;
        flex-direction: row;

        margin-top: $space;
      }

      .footer-btn {
        border-width: $border-width-thin;
        font-size: toRem(12px);
        height: toRem(34px);
        padding: $space-xs 0;

        & + .footer-btn {
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

  .balance {
    cursor: pointer;

    &.active {
      .label {
        font-family: GilroySemibold;
      }
    }
  }
}

.Night {
  #dex--order-form {
    .body {
      .percentages {
        background: $background-night-light;

        .percent-btn {
          @extend %small-uppercase-grey-label;
        }
      }

      .options {
        .option {
          .aph-icon {
            .fill {
              fill: $purple !important;
            }
          }
        }
      }
    }

    .balance.active .label  {
      @extend %small-uppercase-grey-label;
    }
  }
}
</style>


