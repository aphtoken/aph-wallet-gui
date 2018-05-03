<template>
  <div :class="['holding', {'is-clickable': isClickable}]" @click="handleOnClick">
    <aph-token-icon :symbol="holding.symbol"></aph-token-icon>
    <div class="token">
      <div class="name">{{ holding.name }}</div>
      <div class="currency">{{ holding.symbol }}</div>
    </div>
    <div class="balance">
      <div class="amount">
        {{ $formatNumber(holding.balance) }}<span class="currency">{{ holding.symbol }}</span>
      </div>
      <div :class="['change', {decrease: holding.change24hrPercent < 0, increase: holding.change24hrPercent > 0}]">{{ $formatNumber(holding.change24hrPercent) }}</div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    isClickable() {
      return _.isFunction(this.onClick);
    },
  },

  methods: {
    handleOnClick() {
      if (this.onClick) {
        this.onClick(this.holding);
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
  transition: $transition;

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
    }

    .currency {
      @extend %small-uppercase-grey-label-dark;

      font-size: toRem(15px);
    }
  }

  .balance {
    flex: none;
    font-family: GilroyMedium;
    text-align: right;

    .amount {
      margin-bottom: $space-sm;
      font-size: toRem(19px);

      .currency {
        margin-left: $space-xs;
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
    cursor: pointer;

    &:hover, &.active {
      border-color: $purple;
    }
  }
}
</style>

