<template>
  <modal-wrapper id="aph-order-confirmation-modal" identifier="placeOrder">
    <template>
      <div class="body">
        <h2>Confirm Your Order:</h2>
        <p class="description">
          Are you sure that you would like to place a
          <span class="type">{{ $store.state.orderToConfirm.orderType }}</span>
          <span :class="['side', $store.state.orderToConfirm.side]">{{ $store.state.orderToConfirm.side }}</span>
          <span class="postOnly" v-if="$store.state.orderToConfirm.postOnly === true">Post Only</span>
          order for
          <span class="quantity">{{ $formatNumber($store.state.orderToConfirm.quantity) }}</span>
          <span class="currency">{{ $store.state.orderToConfirm.market.quoteCurrency }}</span>
          <span v-if="$store.state.orderToConfirm.orderType === 'Limit'">
            at a unit price of
            <span class="price">
              {{ $formatNumber($store.state.orderToConfirm.price) }}
              {{ $store.state.orderToConfirm.market.baseCurrency }}
            </span>
            for a total of
            <span class="price">
              {{ $formatNumber($store.state.orderToConfirm.price * $store.state.orderToConfirm.quantity) }}
              {{ $store.state.orderToConfirm.market.baseCurrency }}
            </span>
          </span>?
        </p>
        <div v-if="offersToTake.length === 0">
          This will be a maker order that will be left on the book until someone takes it. You will not be charged a fee for this trade.
        </div>
        <div class="taking" v-if="offersToTake.length > 0 && $store.state.orderToConfirm.postOnly === true">
          This order would take the following offers:
          <div>
            <div class="offer" v-for="(offer, index) in offersToTake" :key="index">
              x{{ $formatNumber(offer.quantity) }} @{{ $formatNumber(offer.price) }}
            </div>
            <br />This means that it is ineligible as a Post Only order.
          </div>
        </div>
        <div class="taking" v-if="offersToTake.length > 0 && $store.state.orderToConfirm.postOnly === false">
          You will be immediately taking these {{ offersToTake.length }} offers:
          <div>
            <div class="offer" v-for="(offer, index) in offersToTake" :key="index">
              x{{ $formatNumber(offer.quantity) }} @{{ $formatNumber(offer.price) }}
            </div>
          </div>
          <div v-if="backupOffersToTake.length > 0">
            We've also matched {{ backupOffersToTake.length }} backup orders that may be matched in the event that any of these orders are taken already.
          </div>
          <div v-if="$formatNumber($store.state.orderToConfirm.minTakerFees) !== $formatNumber($store.state.orderToConfirm.maxTakerFees)">
            The fee for completing your trade will depend on the final number of offers matched but will be between {{ $formatNumber($store.state.orderToConfirm.minTakerFees) }} APH and {{ $formatNumber($store.state.orderToConfirm.maxTakerFees) }} APH
          </div>
          <div v-else>
            The fee for completing your trade will be {{ $formatNumber($store.state.orderToConfirm.maxTakerFees) }} APH
          </div>
          <div v-if="$store.state.orderToConfirm.deposits.length > 0">
            <div class="deposit" v-for="(deposit, index) in $store.state.orderToConfirm.deposits" :key="index">
              This order requires {{ $formatNumber(deposit.quantityRequired) }} {{ deposit.symbol }} to be completed.
              Your current contract balance is only {{ $formatNumber(deposit.currentQuantity) }} {{ deposit.symbol }}.
              Submitting this order will first submit {{ $formatNumber(deposit.quantityToDeposit) }} {{ deposit.symbol }} in order to process successfully.
            </div>
          </div>
        </div>
        <div v-if="offersToTake.length > 0 && $store.state.orderToConfirm.quantityToTake < $store.state.orderToConfirm.quantity && $store.state.orderToConfirm.postOnly === false">
          <div v-if="offersToTake.length > 0">
            You will also be creating the following maker order that will be left on the book until someone takes it. You will not be charged a fee for this trade:
            <div class="offer">
              {{ $store.state.orderToConfirm.side }} x{{ $formatNumber($store.state.orderToConfirm.quantity.minus($store.state.orderToConfirm.quantityToTake))}} @{{ $formatNumber($store.state.orderToConfirm.price) }}
            </div>
          </div>
          <div v-else>
            This will be a maker order that will be left on the book until someone takes it. You will not be charged a fee for this trade.
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="cancel-btn" @click="onCancel">Cancel</div>
        <button class="confirm-btn" @click="onConfirmed" :disabled="shouldDisableConfirmButton">
          {{ buttonLabel }}
        </button>
      </div>
    </template>
  </modal-wrapper>
</template>

<script>
import ModalWrapper from './ModalWrapper';

export default {
  components: {
    ModalWrapper,
  },

  computed: {
    orderStatus() {
      return this.$store.state.orderToConfirm.status;
    },

    buttonLabel() {
      return this.$isPending('placeOrder') ? `${this.orderStatus}...` : 'Submit';
    },

    shouldDisableConfirmButton() {
      return this.$isPending('placeOrder')
        || (this.$store.state.orderToConfirm.quantityToTake > 0 && this.$store.state.orderToConfirm.postOnly === true);
    },

    offersToTake() {
      return _.filter(this.$store.state.orderToConfirm.offersToTake, (offer) => {
        return offer.isBackupOffer !== true;
      });
    },

    backupOffersToTake() {
      return _.filter(this.$store.state.orderToConfirm.offersToTake, (offer) => {
        return offer.isBackupOffer === true;
      });
    },
  },

  props: {
    onConfirmed: {
      required: true,
      type: Function,
    },
    onCancel: {
      required: true,
      type: Function,
    },
  },
};
</script>


<style lang="scss">
#aph-order-confirmation-modal {
  .content {
    width: toRem(700px);
  }

  .body {
    padding: $space-lg $space-lg $space-lg;
    text-align: center;
    display: block;
    position: relative;

    p, > div > div {
      margin-bottom: $space-lg;
    }
    
    h2 {
      font-family: GilroySemibold;
    }
    
    .description {
      .type, .side, .quantity, .currency, .price, .postOnly {
        font-family: GilroySemibold;
        font-size: toRem(16px);
      }
      
      .side {
        font-size: toRem(18px);
        text-decoration: underline;

        &.Buy {
          color: $green;
        }
        &.Sell {
          color: $red;
        }
      }
      
      .postOnly {
        font-style: italic;
        color: $grey;
      }
    }
    
    .offer {
      margin-bottom: $space-xs;
    }
  }

  .footer {
    display: flex;

    > * {
      flex: 1;
    }
  }

  .cancel-btn {
    @extend %btn-footer-light;

    border-bottom-left-radius: $border-radius;
  }

  .confirm-btn {
    @extend %btn-footer;

    border-bottom-right-radius: $border-radius;
  }
}
</style>

