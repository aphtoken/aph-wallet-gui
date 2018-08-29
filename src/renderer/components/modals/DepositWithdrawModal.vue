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
      <aph-input type="number" placeholder="Amount" :light="true" v-model="amount"></aph-input>
    </div>
    <div class="footer">
      <button class="cancel-btn" @click="onCancel">{{$t('cancel')}}</button>
      <button class="deposit-withdraw-btn" @click="onConfirmed(isDeposit, holding, amount)" 
        :disabled="shouldDisableDepositWithdrawButton">{{isDeposit ? $t('deposit') : $t('withdraw')}}</button>
    </div>
  </modal-wrapper>
</template>

<script>
import ModalWrapper from './ModalWrapper';

export default {
  components: {
    ModalWrapper,
  },

  computed: {
    shouldDisableDepositWithdrawButton() {
      return !this.amount.length || this.amount <= 0;
    },
    holding() {
      return _.find(this.$store.state.holdings, (holding) => {
        return holding.assetId === this.$store.state.depositWithdrawModalModel.holdingAssetId;
      });
    },
  },

  data() {
    return {
      isDeposit: false,
      amount: '',
    };
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

