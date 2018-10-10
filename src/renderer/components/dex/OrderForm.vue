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
              <aph-icon :title="postOnlyToolTip" class="post-only-info-icon" name="info-question-mark"></aph-icon>
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
            <div class="label">
              <aph-icon name="info-question-mark"></aph-icon>
              {{$t('balance')}} ({{ quoteHolding.symbol }})
            </div>
            <div class="value">{{ $formatNumber(quoteHolding.availableBalance) }}</div>
          </div>
          <div @click="actionableHolding = baseHolding" :class="['balance', {active: baseHolding.symbol === actionableHolding.symbol}]" :title="baseBalanceToolTip">
            <div class="label">
              <aph-icon name="info-question-mark"></aph-icon>
              {{$t('balance')}} ({{ baseHolding.symbol }})
            </div>
            <div class="value">{{ $formatNumber(baseHolding.availableBalance) }}</div>
          </div>
          <div @click="actionableHolding = aphHolding" :class="['balance', {active: aphHolding.symbol === actionableHolding.symbol}]" :title="aphBalanceToolTip" v-if="baseHolding.symbol !== 'APH' && quoteHolding.symbol !== 'APH'">
            <div class="label">
              <aph-icon name="info-question-mark"></aph-icon>
              {{$t('balance')}} (APH)
            </div>
            <div class="value">{{ $formatNumber(aphHolding.availableBalance) }}</div>
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
              <button @click="claimGasForDexContract" class="footer-btn">Claim DEX Gas</button>
              <button @click="reclaimOrhphanFunds" class="footer-btn">Reclaim Orphan Funds</button> -->
          </div>
       </div>
      </aph-spinner-wrapper>
    </section>
    <aph-order-confirmation-modal v-if="$store.state.showOrderConfirmationModal"
      :onConfirmed="orderConfirmed" :onCancel="hideOrderConfirmationModal" />
    <aph-deposit-withdraw-modal v-if="$store.state.depositWithdrawModalModel"
      :onConfirmed="depositWithdrawConfirmed" :onCancel="hideDepositWithdrawModal" />
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
let storeUnwatch;

export default {
  components: {
    AphOrderConfirmationModal,
    AphDepositWithdrawModal,
  },

  created() {
    this.loadHoldings();

    this.actionableHolding = this.quoteHolding;

    loadHoldingsIntervalId = setInterval(() => {
      // TODO: is this redundant with the fetch occurring in AuthenticatedWrapper.vue
      this.loadHoldingsSilently();
    }, this.$constants.intervals.HOLDINGS_POLLING);

    storeUnwatch = this.$store.watch(
      () => {
        return this.$store.state.orderQuantity;
      }, () => {
        if (this.selectedPercent && this.percent(this.selectedPercent) !== this.$store.state.orderQuantity) {
          this.selectedPercent = null;
        }

        this.validateQuantity();
      });
  },

  beforeDestroy() {
    clearInterval(loadHoldingsIntervalId);
    storeUnwatch();
  },

  computed: {
    currentMarket() {
      return this.$store.state.currentMarket;
    },

    isTradingDisabled() {
      return this.isOutOfDate || this.isMarketClosed;
    },

    isOutOfDate() {
      return this.$store.state.latestVersion && this.$store.state.latestVersion.prodExchangeScriptHash
        && this.$store.state.latestVersion.prodExchangeScriptHash.replace('0x', '')
          !== this.$store.state.currentNetwork.dex_hash;
    },

    isMarketClosed() {
      return this.$store.state.currentMarket && this.$store.state.currentMarket.isOpen === false;
    },

    quoteHolding() {
      if (this.currentMarket && this.$store.state.holdings) {
        const holding = _.find(this.$store.state.holdings, { assetId: this.currentMarket.quoteAssetId });

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
        const holding = _.find(this.$store.state.holdings, { assetId: this.currentMarket.baseAssetId });

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
        const holding = _.find(this.$store.state.holdings, { assetId: this.$store.state.currentNetwork.aph_hash });

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
    postOnlyToolTip() {
      try {
        return this.$t('postOnlyTooltip');
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
      this.$store.commit('setOrderQuantity', '');
      this.$store.commit('setOrderPrice', '');
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
      this.$store.dispatch('fetchHoldings');
    },
    loadHoldingsSilently() {
      this.$store.dispatch('fetchHoldings', { isRequestSilent: true });
    },
    setSide(side) {
      this.side = side;
      this.$store.commit('setOrderQuantity', '');
    },

    setPercent(value) {
      if (this.orderType === 'Limit' && !this.$store.state.orderPrice
        && this.side === 'Buy') {
        this.$services.alerts.error(this.$t('pleaseEnterAPrice'));
        return;
      }

      this.$store.commit('setOrderQuantity', this.percent(value));
      this.selectedPercent = value;
    },

    percent(value) {
      if (this.side === 'Buy') {
        return this.percentForBuy(value);
      }

      return this.percentForSell(value);
    },

    percentForBuy(value) {
      if (!this.baseHolding || !this.baseHolding.availableBalance
        || this.baseHolding.availableBalance.isLessThanOrEqualTo(0)) {
        this.$services.alerts.error(this.$t('noBalanceAvailable', {
          assetSymbol: this.currentMarket.baseCurrency,
          sideDescription: 'Buy with',
        }));
        return '';
      }

      const baseAssetQuantity = this.baseHolding.availableBalance;

      let newQuantity = new BigNumber(0);
      const book = this.$store.state.orderBook.asks;
      let orderPrice = null;
      if (this.orderType !== 'Market' && this.$store.state.orderPrice !== '') {
        orderPrice = new BigNumber(this.$store.state.orderPrice);
      }

      let willTakeOffers = false;
      if (!orderPrice || orderPrice.isGreaterThanOrEqualTo(book[0].price)) {
        willTakeOffers = !this.postOnly;
      }

      let leftToSpend = baseAssetQuantity;

      if (willTakeOffers) {
        book.forEach((level) => {
          if (orderPrice && level.price.isGreaterThan(orderPrice)) {
            return;
          }

          if (leftToSpend.isLessThanOrEqualTo(0)) {
            return;
          }

          const levelCost = level.quantity.multipliedBy(level.price);

          let spendAtThisLevel = levelCost.isGreaterThan(leftToSpend) ? leftToSpend : levelCost;
          if (this.baseHolding.assetId === this.$store.state.currentNetwork.aph_hash) {
            const maxLots = spendAtThisLevel.dividedBy(level.price).dividedBy(this.currentMarket.minimumSize);
            leftToSpend = leftToSpend.minus(maxLots.multipliedBy(this.currentMarket.buyFee));
          }

          spendAtThisLevel = levelCost.isGreaterThan(leftToSpend) ? leftToSpend : levelCost;
          newQuantity = newQuantity.plus(spendAtThisLevel.dividedBy(level.price));
          leftToSpend = leftToSpend.minus(spendAtThisLevel);
        });
      }

      if (leftToSpend.isGreaterThan(0) && orderPrice) {
        newQuantity = newQuantity.plus(leftToSpend.dividedBy(orderPrice));
      }

      newQuantity = newQuantity.multipliedBy(value);
      newQuantity = newQuantity
        .multipliedBy(100000000)
        .decimalPlaces(0, BigNumber.ROUND_DOWN)
        .dividedBy(100000000.0);
      return newQuantity.toString();
    },

    percentForSell(value) {
      if (!this.quoteHolding || !this.quoteHolding.availableBalance
        || this.quoteHolding.availableBalance.isLessThanOrEqualTo(0)) {
        this.$services.alerts.error(this.$t('noBalanceAvailable', {
          assetSymbol: this.currentMarket.quoteCurrency,
          sideDescription: 'Sell',
        }));
        return '';
      }

      const quoteAssetQuantity = this.quoteHolding.availableBalance;


      let orderPrice = null;
      if (this.orderType !== 'Market' && this.$store.state.orderPrice !== '') {
        orderPrice = new BigNumber(this.$store.state.orderPrice);
      }

      const book = this.$store.state.orderBook.bids;
      let willTakeOffers = false;
      if (!orderPrice || orderPrice.isLessThanOrEqualTo(book[0].price)) {
        willTakeOffers = !this.postOnly;
      }

      let leftToSpend = quoteAssetQuantity;
      let newQuantity = new BigNumber(0);

      if (willTakeOffers) {
        book.forEach((level) => {
          if (orderPrice && level.price.isLessThan(orderPrice)) {
            return;
          }

          if (leftToSpend.isLessThanOrEqualTo(0)) {
            return;
          }

          const levelCost = level.quantity;

          let spendAtThisLevel = levelCost.isGreaterThan(leftToSpend) ? leftToSpend : levelCost;
          if (this.quoteHolding.assetId === this.$store.state.currentNetwork.aph_hash) {
            const maxLots = spendAtThisLevel.dividedBy(this.currentMarket.minimumSize);
            leftToSpend = leftToSpend.minus(maxLots.multipliedBy(this.currentMarket.sellFee));
          }

          spendAtThisLevel = levelCost.isGreaterThan(leftToSpend) ? leftToSpend : levelCost;
          newQuantity = newQuantity.plus(spendAtThisLevel);
          leftToSpend = leftToSpend.minus(spendAtThisLevel);
        });
      }

      if (leftToSpend.isGreaterThan(0) && orderPrice) {
        newQuantity = newQuantity.plus(leftToSpend);
      }

      newQuantity = newQuantity.multipliedBy(value);
      newQuantity = newQuantity
        .multipliedBy(100000000)
        .decimalPlaces(0, BigNumber.ROUND_DOWN)
        .dividedBy(100000000.0);
      return newQuantity.toString();
    },

    marketPriceForQuantity(side, quantity) {
      let quantityRemaining = new BigNumber(quantity);
      let totalMultiple = new BigNumber(0);
      let book = this.$store.state.orderBook.asks;

      if (side === 'Sell') {
        book = this.$store.state.orderBook.bids;
      }

      book.forEach((level) => {
        const takeQuantity = level.quantity.isGreaterThan(quantityRemaining) ? quantityRemaining : level.quantity;
        if (quantityRemaining.isLessThanOrEqualTo(0)) {
          return;
        }
        quantityRemaining = quantityRemaining.minus(takeQuantity);
        totalMultiple = totalMultiple.plus(takeQuantity.multipliedBy(level.price));
      });

      return (totalMultiple / quantity).toString();
    },

    validateQuantity() {
      if (!this.$store.state.orderQuantity
        || this.$store.state.orderQuantity === ''
        || this.$store.state.orderQuantity[this.$store.state.orderQuantity - 1] === '.') {
        return;
      }

      const minTickSizeFraction = this.currentMarket.minimumTickSize - Math.floor(this.currentMarket.minimumTickSize);
      let allowedQuantityDecimals;
      if (minTickSizeFraction <= 0.00000001) {
        allowedQuantityDecimals = 0;
      } else {
        allowedQuantityDecimals = Math.log10(minTickSizeFraction * (10 ** 8));
      }
      const decimalFactor = 10 ** allowedQuantityDecimals;
      const beforeRounded = new BigNumber(this.$store.state.orderQuantity);
      const floored = beforeRounded.multipliedBy(decimalFactor).decimalPlaces(0, BigNumber.ROUND_DOWN);
      const roundedQuantity = floored.dividedBy(decimalFactor);
      if (roundedQuantity.isEqualTo(beforeRounded) === false) {
        this.$store.commit('setOrderQuantity', roundedQuantity.toString());
        this.$services.alerts.error(this.$t('orderQuantityLimited', {
          marketName: this.currentMarket.marketName,
          allowedQuantityDecimals,
        }));
      }
    },

    confirmOrder() {
      this.validateQuantity();

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
      const action = (isDeposit ? this.$t('deposit') : this.$t('withdraw'));
      const message = this.$t('relayedToNetwork', {
        amount,
        symbol: holding.symbol,
        action,
      });
      const services = this.$services;
      this.$services.dex[isDeposit ? 'depositAsset' : 'withdrawAsset'](holding.assetId, Number(amount))
        .then(() => {
          services.alerts.success(message);
        })
        .catch((e) => {
          services.alerts.exception(e);
        });

      this.hideDepositWithdrawModal();
    },

    hideOrderConfirmationModal() {
      this.$store.commit('setOrderToConfirm', null);
    },

    async setMarket() {
      /*
      await this.$services.dex.setManager('')
        .then(() => {
          this.$services.alerts.success('Set Manager');
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
      */
      this.$services.alerts.info('Add assets');

      try {
        /*
        await this.$services.dex.setAssetSettings(this.$store.state.currentNetwork.aph_hash, 0, true);
        this.$services.alerts.success('Setup asset APH');

        // await this.$services.dex.setAssetSettings(this.$store.state.currentNetwork.ati_hash, 0, true);
        // this.$services.alerts.success('Setup asset ATI');

        await this.$services.dex.setAssetSettings(this.$services.assets.GAS, 0, true);
        this.$services.alerts.success('Setup asset GAS');

        await this.$services.dex.setAssetSettings(this.$services.assets.NEO, 0, true);
        this.$services.alerts.success('Setup asset NEO');
        */

        // await this.$services.dex.setAssetSettings('b951ecbbc5fe37a9c280a76cb0ce0014827294cf', 0, true);
        // this.$services.alerts.success('Setup asset DBC');

        // await this.$services.dex.setAssetSettings('a3640dd3c560c75528e5f861da5da98958d0d713', 0);
        // this.$services.alerts.success('Setup asset NXT2');

        /*
        await this.$services.dex.setAssetSettings('c36aee199dbba6c3f439983657558cfb67629599', 0);
        this.$services.alerts.success('Setup asset NKN');

        await this.$services.dex.setAssetSettings('1578103c13e39df15d0d29826d957e85d770d8c9', 0);
        this.$services.alerts.success('Setup asset PHX');

        await this.$services.dex.setAssetSettings('ed07cffad18f1308db51920d99a2af60ac66a7b3', 0);
        this.$services.alerts.success('Setup asset SOUL');

        await this.$services.dex.setAssetSettings('132947096727c84c7f9e076c90f08fec3bc17f18', 0);
        this.$services.alerts.success('Setup asset TKY');
        */

        /*
        await this.$services.dex.setMarket(this.$store.state.currentNetwork.aph_hash,
          this.$services.assets.NEO,
          100, 0.0000001, 0, 0.25, true);
        this.$services.alerts.success('Setup Market NEO-APH');
        */
        /*
        await this.$services.dex.setMarket(this.$services.assets.GAS,
          this.$services.assets.NEO,
          1, 0.0000001, 0.2, 0.2, true);
        this.$services.alerts.success('Setup Market NEO-GAS');

        await this.$services.dex.setMarket(this.$store.state.currentNetwork.aph_hash,
          this.$services.assets.GAS,
          100, 0.0001, 0.0000, 0.25, true);
        this.$services.alerts.success('Setup Market GAS-APH');
        */

        /*
        await this.$services.dex.setMarket('b951ecbbc5fe37a9c280a76cb0ce0014827294cf',
          this.$services.assets.NEO,
          1000, 0.0001, 0.27, 0.27, true);
        this.$services.alerts.success('Setup Market NEO-DBC');

        await this.$services.dex.setMarket('b951ecbbc5fe37a9c280a76cb0ce0014827294cf',
          this.$services.assets.GAS,
          1000, 0.0001, 0.27, 0.27, true);
        this.$services.alerts.success('Setup Market GAS-DBC');
        */

        /*
        await this.$services.dex.setMarket('c36aee199dbba6c3f439983657558cfb67629599',
          this.$services.assets.NEO,
          200, 0.0001, 0.35, 0.35, true);
        this.$services.alerts.success('Setup Market NEO-NKN');

        await this.$services.dex.setMarket('c36aee199dbba6c3f439983657558cfb67629599',
          this.$services.assets.GAS,
          1000, 0.0001, 0.35, 0.35, true);
        this.$services.alerts.success('Setup Market GAS-NKN');
        */

        /*
        await this.$services.dex.setMarket('1578103c13e39df15d0d29826d957e85d770d8c9',
          this.$services.assets.NEO,
          1000, 0.0001, 0.47, 0.47, true);
        this.$services.alerts.success('Setup Market NEO-PHX');
        */
        /*
        await this.$services.dex.setMarket('1578103c13e39df15d0d29826d957e85d770d8c9',
          this.$services.assets.GAS,
          1000, 0.0001, 0.47, 0.47, true);
        this.$services.alerts.success('Setup Market GAS-PHX');


        await this.$services.dex.setMarket('ed07cffad18f1308db51920d99a2af60ac66a7b3',
          this.$services.assets.NEO,
          1000, 0.0001, 0.47, 0.47, true);
        this.$services.alerts.success('Setup Market NEO-SOUL');

        await this.$services.dex.setMarket('ed07cffad18f1308db51920d99a2af60ac66a7b3',
          this.$services.assets.GAS,
          2000, 0.0001, 0.44, 0.44, true);
        this.$services.alerts.success('Setup Market GAS-SOUL');

        await this.$services.dex.setMarket('132947096727c84c7f9e076c90f08fec3bc17f18',
          this.$services.assets.NEO,
          2000, 0.0001, 0.44, 0.44, true);
        this.$services.alerts.success('Setup Market NEO-TKY');

        await this.$services.dex.setMarket('132947096727c84c7f9e076c90f08fec3bc17f18',
          this.$services.assets.GAS,
          2000, 0.0001, 0.44, 0.44, true);
        this.$services.alerts.success('Setup Market GAS-TKY');
        */

        // NKN c36aee199dbba6c3f439983657558cfb67629599
        // PHX 1578103c13e39df15d0d29826d957e85d770d8c9
        // SOUL ed07cffad18f1308db51920d99a2af60ac66a7b3
        // TKY 132947096727c84c7f9e076c90f08fec3bc17f18

        /*
        await this.$services.dex.setMarket(this.$store.state.currentNetwork.ati_hash,
          this.$services.assets.GAS,
          200, 0.00001, 0.25, 0.25);
        this.$services.alerts.success('Setup Market GAS-ATI');

        await this.$services.dex.setMarket(this.$store.state.currentNetwork.ati_hash,
          this.$services.assets.NEO,
          200, 0.00001, 0.25, 0.25);
        this.$services.alerts.success('Setup Market NEO-ATI');

        await this.$services.dex.setMarket(this.$store.state.currentNetwork.ati_hash,
          this.$store.state.currentNetwork.aph_hash,
          200, 0.00001, 0.25, 0);
        this.$services.alerts.success('Setup Market APH-ATI');
        */

        /*
        await this.$services.dex.setMarket('a3640dd3c560c75528e5f861da5da98958d0d713',
          this.$services.assets.APH,
          10, 0.000001, 0.025, 0)
        */

        /* CTX
        await this.$services.dex.setMarket('9aff1e08aea2048a26a3d2ddbb3df495b932b1e7',
          this.$services.assets.APH,
          1, 0.00001, 0.01, 0.01)
        */
      } catch (e) {
        this.$services.alerts.exception(e);
      }
    },

    async reclaimOrhphanFunds() {
      this.$services.alerts.info('Start reclaim of orphaned GAS');
      await this.$services.dex.reclaimOrphanFundsToOwner(this.$services.assets.GAS);
    },

    async setMinimumClaimBlocks() {
      await this.$services.dex.setMinimumClaimBlocks(180)
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
      margin-top: $space;
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
        padding: $space-sm 0;
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
    .aph-input {
      border-color: $background;

      &.focused {
        .border {
          border-color: $purple;
        }
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
      display: flex;
      justify-content: center;
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

        .post-only-info-icon {
          margin-right: $space-sm;
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
    padding: $space 0;

    .balance {
      padding: 0 $space;
    }

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
      padding: 0 $space;
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

      flex: none;
      display: flex;
      align-items: center;

      > .aph-icon {
        margin-right: $space-sm;

        > svg {
          height: toRem(12px);
        }
      }
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
    border-left: $border-width-thin solid transparent;

    &.active {
      border-color: $purple;

      .label {
        color: $purple !important;
        font-family: GilroySemibold;
      }
    }
  }

  ::-webkit-scrollbar {
    width: $border-width-thick;
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

          .post-only-info-icon {
            .fill {
              fill: $dark-grey !important;
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


