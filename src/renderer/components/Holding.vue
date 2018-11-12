<template>
  <div :class="['holding', {'is-clickable': isClickable}]" @click="handleOnClick">
    <div class="left">
      <aph-token-icon :symbol="holding.symbol"></aph-token-icon>
      <div class="token">
        <div class="name" :title="holding.asset">{{ holding.name }}</div>
        <div class="currency">{{ holding.symbol }}</div>
      </div>
    </div>
    <div class="center" v-if="canBeRemoved">
      <div class="remove" @click="handleOnRemove">{{$t('remove')}}</div>
    </div>
    <claim-gas-button v-if="this.holding.symbol === 'NEO'"></claim-gas-button>
    <div class="right">
      <div class="balance">
        <div class="amount" :title="balanceToolTip">
          <span class="formatted">{{ $formatNumber(holding.balance) }}</span>
          <span class="currency">{{ holding.symbol }}</span>
          <aph-icon name="info-question-mark"></aph-icon>
        </div>
        <div :class="['change', {decrease: holding.change24hrPercent < 0, increase: holding.change24hrPercent > 0}]">{{ $formatNumber(holding.change24hrPercent) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import ClaimGasButton from './dashboard/ClaimGasButton';

export default {
  components: {
    ClaimGasButton,
  },
  computed: {
    canBeRemoved() {
      return this.holding.canRemove;
    },

    isClickable() {
      return _.isFunction(this.onClick);
    },

    balanceToolTip() {
      try {
        const walletBalance = this.holding.balance
          ? this.$formatNumber(this.holding.balance) : '0';
        const contractBalance = this.holding.contractBalance
          ? this.$formatNumber(this.holding.contractBalance) : '0';
        const openOrdersBalance = this.holding.openOrdersBalance
          ? this.$formatNumber(this.holding.openOrdersBalance) : '0';
        return this.$t('walletBalanceContractBalance', { walletBalance, contractBalance, openOrdersBalance });
      } catch (e) {
        return '';
      }
    },
  },

  methods: {
    handleOnClick() {
      if (this.onClick) {
        this.onClick(this.holding);
      }
    },

    handleOnRemove() {
      if (this.onRemove) {
        this.onRemove(this.holding);
      }
    },
  },

  props: {
    holding: {
      required: true,
      type: Object,
    },

    onClick: {
      type: Function,
    },

    onRemove: {
      type: Function,
    },
  },
};
</script>

<style lang="scss">
.holding {
  align-items: center;
  background: white;
  border-left: $border-width-thick solid transparent;
  border-radius: $border-radius;
  display: flex;
  padding: 1.5rem;

  .left, .right, .center {
    display: flex;
  }

  .left , .right {
    flex: 1;
  }

  .center {
    flex: none;
  }

  .aph-token-icon {
    flex: none;
    padding-right: $space;
  }

  .token {
    flex: 1;

    .name {
      font-family: GilroyMedium;
      font-size: toRem(19px);
      margin-bottom: $space-sm;
      white-space: nowrap;
    }

    .currency {
      @extend %small-uppercase-grey-label-dark;

      font-size: toRem(15px);
    }
  }

  .remove {
    @extend %small-uppercase-grey-label;
    @include transition(background-color, color, opacity, visibility);

    cursor: pointer;
    opacity: 0;
    padding: $space;
    visibility: none;

    &:hover {
      color: $purple;
    }
  }

  .balance {
    flex: 1;
    font-family: GilroyMedium;
    text-align: right;

    .amount {
      align-items: center;
      display: flex;
      font-size: toRem(19px);
      justify-content: flex-end;
      margin-bottom: $space-sm;

      .aph-icon {
        svg {
          height: toRem(14px);
        }
      }

      .currency {
        margin: 0 $space-sm;
      }
    }

    .change {
      font-size: toRem(15px);

      &.increase {
        color: $green;

        &:before {
          content: "+";
        }

        &:after {
          content: "%";
          margin-left: $space-xs;
        }
      }

      &.decrease {
        color: $red;
      }

      &:after {
        content: "%";
        margin-left: $space-xs;
      }
    }
  }

  & + .holding {
    margin-top: $space-lg;
  }

  &.is-clickable {
    @include transition(border-color);

    cursor: pointer;

    &:hover, &.active {
      border-color: $purple;
    }
  }

  &:hover {
    .remove {
      opacity: 1;
      visibility: visible;
    }
  }
}
</style>

