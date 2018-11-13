<template>
  <modal-wrapper id="aph-commit-modal">
    <div class="icons">
      <aph-icon name="hex"></aph-icon>
      <aph-icon name="commit"></aph-icon>
    </div>
    <div class="header">
      {{$t('commit')}}
    </div>
    <div class="body">
      <p>
        {{$t('howMuchWouldYouLikeToCommit')}}
      </p>

      <div class="amount">
        <aph-input type="number" :placeholder="$t('amount')" :light="true" v-model="amount"></aph-input>
        <div class="max" v-if="aphHolding" @click="setAmountToMax">{{$t('max')}}</div>
      </div>

      <button class="commit-btn" @click="onConfirmed(amount)"
        :disabled="shouldDisableCommitButton">{{$t('commit')}}</button>
    </div>
    <div class="footer">
      <button class="cancel-btn" @click="onCancel">{{$t('cancel')}}</button>
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
    shouldDisableCommitButton() {
      return !this.amount.length || this.amount <= 0
        || this.aphHolding.balance.plus(this.aphHolding.contractBalance).isLessThan(this.amount);
    },
    aphHolding() {
      if (this.$store.state.holdings) {
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
  },

  data() {
    return {
      amount: '',
    };
  },

  methods: {
    setAmountToMax() {
      if (this.aphHolding) {
        this.amount = this.aphHolding.balance.plus(this.aphHolding.contractBalance).toString();
      }
    },
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
#aph-commit-modal {
  .content {
    width: toRem(500px);
    overflow: visible;
  }

  .header {
    font-size: toRem(30px);
    padding: $space-lg $space-lg 0;
    text-align: center;
  }

  .body {
    padding: $space $space-lg $space-lg;

    p {
      font-family: GilroySemiBold;
    }



    .amount {
      position: relative;

      input {
        box-sizing: border-box;
        padding-right: $space-lg;
      }

      .max {
        @include transition(color);

        bottom: toRem(26px);
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

    .aph-input {
      border-color: $grey;
      margin: $space 0;

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



  .icons {
    position: relative;
    margin: toRem(-30px) auto toRem(30px) auto;
    width: toRem(40px);
    height: toRem(40px);

    .aph-icon {
      position: absolute;
      width: toRem(40px);
      height: toRem(40px);

      .icon {
        svg {
          position: relative;
          margin-top: 10%;
        }

        &.commit {
          margin: toRem(5px) 0 0 0;
          .fill {
            fill: white;
          }
        }

        &.hex {
          margin: toRem(-25px);
          .fill {
            fill: $purple;
          }
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
  }

  .commit-btn {
    @extend %btn;

    margin: $space-lg auto 0 auto;
    width: toRem(300px);
  }
}
</style>

