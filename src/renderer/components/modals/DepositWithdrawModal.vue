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
        <aph-input :isNumeric="true" @blur="amount = $cleanAmount(amount, holding)" placeholder="Amount" :light="true" v-model="amount"></aph-input>
        <div class="max" v-if="hasAsset" @click="setAmountToMax">{{$t('max')}}</div>
      </div>
    </div>
    <div class="footer">
      <button class="cancel-btn" @click="onCancel">{{$t('cancel')}}</button>
      <button class="deposit-withdraw-btn" @click="confirm()" 
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
      return isNaN(this.amount)
        || !this.amount.length
        || this.amount <= 0
        || (this.amount > 0 && (this.isDeposit
          ? this.holding.balance && this.holding.balance.isLessThan(this.amount)
          : this.holding.contractBalance && this.holding.contractBalance.isLessThan(this.amount)));
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

      if (this.isDeposit && this.holding.symbol === 'GAS') {
        // multiply by 10 to save some additional gas for transactions and to withdrawal
        this.amount = new BigNumber(this.amount).minus(this.$services.network.getSelectedNetwork().fee * 10).toString();
      }

      this.amount = this.$cleanAmount(this.amount, this.holding);
    },
    confirm() {
      this.amount = this.$cleanAmount(this.amount, this.holding);
      this.onConfirmed(this.isDeposit, this.holding, this.amount);
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

