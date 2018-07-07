<template>
  <modal-wrapper id="aph-deposit-withdraw-modal">
    <div class="header">
      {{isDeposit ? 'Deposit': 'Withdraw'}} <span>{{holding.symbol}}</span>
    </div>
    <div class="body">
      <div class="balance-container">
        <div class="balance"> 
          <span class="label">Contract Balance</span>
          <span class="value">{{ $formatNumber(holding.contractBalance) }}</span> 
        </div>
        <div class="balance"> 
          <span class="label">Wallet Balance</span>
          <span class="value">{{ $formatNumber(holding.totalBalance) }}</span> 
        </div>
      </div>
      <aph-input type="number" placeholder="Amount" :light="true" v-model="amount"></aph-input>
    </div>
    <div class="footer">
      <button class="cancel-btn" @click="onCancel">Cancel</button>
      <button class="deposit-withdraw-btn" @click="onConfirmed(isDeposit, holding, amount)" 
        :disabled="shouldDisableDepositWithdrawButton">{{isDeposit ? 'Deposit' : 'Withdraw'}}</button>
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
  },

  data() {
    return {
      isDeposit: false,
      amount: '',
      holding: {
        symbol: '',
      },
    };
  },

  mounted() {
    if (this.$store.state.depositWithdrawModalModel) {
      this.isDeposit = this.$store.state.depositWithdrawModalModel.isDeposit;
      this.holding = this.$store.state.depositWithdrawModalModel.holding;
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

