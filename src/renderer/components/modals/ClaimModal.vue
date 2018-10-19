<template>
  <modal-wrapper id="aph-claim-modal">
    <div class="icons">
      <aph-icon name="hex"></aph-icon>
      <aph-icon name="claim"></aph-icon>
    </div>
    <div class="header" v-if="$store.state.commitState.ableToClaimHeight <= this.currentBlock">
      {{$t('claim')}} ~{{$store.state.commitState.availableToClaim}} APH
    </div>
    <div class="header" v-else>
      {{$t('claim')}} 0 APH
    </div>
    <div class="body">
      <div v-if="$store.state.commitState.ableToClaimHeight <= this.currentBlock">
        <p>
          {{ $t('areYouSureYouWantToClaim') }}
        </p>
        <p>
          {{$t('committedAPHBalance', {
            balance: $store.state.commitState.quantityCommitted
          })}}
        </p>
        <p class="note">{{ $t('closingWalletBeforeClaim') }}</p>
      </div>
      <div v-else>
        <p>
          {{$t('notMetMinimumBlocksToClaim')}}
        </p>
        <p>
          {{$t('youMayStillClaim', {
            balance: $store.state.commitState.quantityCommitted
          })}}
        </p>
        <p>
          {{$t('waitAnAdditionalBlocks', {
            blocks: $store.state.commitState.ableToClaimHeight - this.currentBlock
          })}}
        </p>
        <p class="note">{{ $t('closingWalletBeforeClaim') }}</p>
      </div>
      <button class="commit-btn" @click="onConfirmed()">{{$t('claim')}}</button>
    </div>
    <div class="footer">
      <button class="cancel-btn" @click="onCancel">{{$t('cancel')}}</button>
    </div>
  </modal-wrapper>
</template>

<script>
import { mapGetters } from 'vuex';
import ModalWrapper from './ModalWrapper';

export default {
  components: {
    ModalWrapper,
  },

  computed: {
    ...mapGetters([
      'currentNetwork',
    ]),
    currentBlock() {
      return this.currentNetwork && this.currentNetwork.bestBlock ? this.currentNetwork.bestBlock.index : 0;
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
#aph-claim-modal {
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

    .note {
      font-family: Gilroy;
    }
    p {
      font-family: GilroySemiBold;
      text-align: center;

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

        &.claim {
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

