<template>
  <modal-wrapper id="aph-deposit-withdraw-modal">
    <div class="header">
      {{isDeposit ? $t('deposit'): $t('withdraw')}} <span>{{holding.symbol}}</span>
    </div>
    <div class="body">
      <div class="balance-container">
        <div class="balance"> 
          <span class="label">{{$t('contractBalance')}}</span>
          <span class="value">{{ $formatNumber(holding.contractBalance) }}</span> 
        </div>
        <div class="balance"> 
          <span class="label">{{$t('walletBalance')}}</span>
          <span class="value">{{ $formatNumber(holding.balance) }}</span> 
        </div>
      </div>
      <div class="amount">
        <aph-input @blur="cleanAmount" placeholder="Amount" :light="true" v-model="amount"></aph-input>
        <div class="max" v-if="hasAsset" @click="setAmountToMax">{{$t('max')}}</div>
      </div>
    </div>
    <div class="footer">
      <button class="cancel-btn" @click="onCancel">{{$t('cancel')}}</button>
      <button class="deposit-withdraw-btn" @click="onConfirmed(isDeposit, holding, amount)" 
        :disabled="shouldDisableDepositWithdrawButton">{{isDeposit ? $t('deposit') : $t('withdraw')}}</button>
    </div>
  </modal-wrapper>
</template>

<script>
import { BigNumber } from 'bignumber.js';
import ModalWrapper from './ModalWrapper';

export default {
  components: {
    ModalWrapper,
  },

  computed: {
    shouldDisableDepositWithdrawButton() {
      return isNaN(this.amount) ||
        !this.amount.length ||
        this.amount <= 0;
    },
    holding() {
      return _.find(this.$store.state.holdings, (holding) => {
        return holding.assetId === this.$store.state.depositWithdrawModalModel.holdingAssetId;
      });
    },
    hasAsset() {
      const balance = this.isDeposit ?
        this.holding.balance :
        this.holding.contractBalance;

      return balance > 0;
    },
  },

  data() {
    return {
      isDeposit: false,
      amount: '',
    };
  },

  methods: {
    setAmountToMax() {
      this.amount = this.isDeposit ?
        this.holding.balance.toString() :
        this.holding.contractBalance.toString();
    },

    cleanAmount() {
      if (!this.amount) {
        return;
      }

      let cleanAmount = this.amount.replace(/[^\d.]/g, '');

      const cleanSplit = _.split(cleanAmount, '.');
      if (cleanSplit.length > 2) {
        cleanAmount = `${cleanSplit[0]}.${cleanSplit[1]}`;
      }

      if (cleanAmount && cleanAmount.length > 0) {
        if (this.holding) {
          cleanAmount = new BigNumber(cleanAmount).toFixed(this.holding.decimals != null ? this.holding.decimals : 8);
        } else if (cleanAmount[cleanAmount.length - 1] !== '.'
          && cleanAmount[cleanAmount.length - 1] !== '0') {
          const n = new BigNumber(cleanAmount);
          cleanAmount = this.$formatNumber(n, this.$constants.formats.WHOLE_NUMBER_NO_COMMAS);
        }
      }

      // remove trailing zeros if there is a decimal
      if (cleanAmount.indexOf('.') > -1) {
        cleanAmount = _.trimEnd(cleanAmount, '0');
      }

      // remove decimal point if it is the last character
      if (this.amount && this.amount.length > 0 && this.amount[this.amount.length - 1] !== '.') {
        cleanAmount = _.trimEnd(cleanAmount, '.');
      }

      if (this.amount !== cleanAmount) {
        this.amount = cleanAmount;
      }
    },
  },

  mounted() {
    if (this.$store.state.depositWithdrawModalModel) {
      this.isDeposit = this.$store.state.depositWithdrawModalModel.isDeposit;
    }
  },

  props: {
    onCancel: {
      required: true,
      type: Function,
    },
    onConfirmed: {
      required: true,
      type: Function,
    },
  },
};
</script>
<style lang="scss">
#aph-deposit-withdraw-modal {
  .header {
    font-size: toRem(20px);
    padding: $space-lg $space-lg 0;   
  }

  .body {
    padding: $space $space-lg $space-lg;

    .balance-container {
      border-bottom:1px solid $purple;
      border-top:1px solid $purple;
      padding: $space-sm 0;
      margin-bottom: $space-sm;
      .balance {
        display:flex;
        text-transform: uppercase;
        text-align:left;

        .label {
          flex:3;
        }
        .value {
          flex:2;
        }
      }
    }

    .amount {
      position: relative;

      .aph-input { 
        border-color: $grey;

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

        & + .aph-input {
          margin-top: $space;
        }
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
  }

  .footer {
    text-align:center;
    display: flex;

    > * {
      flex: 1;
    }
  }

  .cancel-btn {
    @extend %btn-footer-light;

    border-bottom-left-radius: $border-radius;
  }

  .deposit-withdraw-btn {
    @extend %btn-footer;

    border-bottom-right-radius: $border-radius;
  }
}
</style>

