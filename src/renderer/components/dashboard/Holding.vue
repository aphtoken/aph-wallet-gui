<template>
  <div class="holding" @click="handleOnClick">
    <div class="left">
      <aph-token-icon :symbol="holding.symbol"></aph-token-icon>
      <div class="token">
        <div class="name" :title="holding.asset">{{ holding.name }}</div>
        <div class="value">{{ $store.state.currencySymbol }}{{ $formatNumber(holding.unitValue) }}
          <div v-if="holding.change24hrPercent > 0" class="change increase">({{ $formatNumber(holding.change24hrPercent) }}%)</div>
          <div v-if="holding.change24hrPercent < 0" class="change decrease">({{ $formatNumber(holding.change24hrPercent) }}%)</div>
        </div>
      </div>
    </div>
    <div class="center" v-if="canBeRemoved">
      <div class="remove" @click="handleOnRemove">{{$t('remove')}}</div>
    </div>
    <div class="right">
      <div class="balance">
        <div class="amount" :title="balanceToolTip">
          <span class="formatted">{{ $formatNumber(holding.balance) }}</span>
          <span class="value">{{ holding.symbol }}</span>
        </div>
        <div class="value">{{ $formatMoney(holding.balance * holding.unitValue) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import ClaimGasButton from './ClaimGasButton';

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
  border-radius: $border-radius;
  cursor: pointer;
  display: flex;
  padding: 1.5rem;

  &:hover {
    background: $border-grey;
  }

  &.active {
    background: $dark-purple;
    color: white;
  }

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
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: center;

    .name {
      font-family: GilroyMedium;
      margin-bottom: $space-sm;
      white-space: nowrap;
    }

    .value {
      white-space: nowrap;
      display: flex;

      .change {
        @include truncate();
        margin-left: $space-sm;
        white-space: nowrap;
        width: 100%;
        overflow: hidden;

        &.increase {
          color: $green;

          &:before {
            content: "+";
          }
        }

        &.decrease {
          color: $red;
        }
      }
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
      justify-content: flex-end;
      margin-bottom: $space-sm;

      .value {
        margin: 0 0 0 $space-sm ;
      }
    }
  }

  & + .holding {
    margin-top: $space-lg;
  }

  &:hover {
    .remove {
      opacity: 1;
      visibility: visible;
    }
  }
}
</style>
