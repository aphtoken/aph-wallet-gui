<template>
  <div :class="['holding', {'is-clickable': isClickable}]" @click="handleOnClick">
    <div class="left">
      <aph-token-icon :symbol="holding.symbol"></aph-token-icon>
      <div class="token">
        <div class="name">{{ holding.name }}</div>
        <div class="currency">{{ holding.symbol }}</div>
      </div>
    </div>
    <div class="center">
      <div class="remove" v-if="canBeRemoved" @click="handleOnRemove">Remove</div>
    </div>
    <div class="right">
      <div class="balance">
        <div class="amount">
          {{ $formatNumber(holding.balance) }}<span class="currency">{{ holding.symbol }}</span>
        </div>
        <div :class="['change', {decrease: holding.change24hrPercent < 0, increase: holding.change24hrPercent > 0}]">{{ $formatNumber(holding.change24hrPercent) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    canBeRemoved() {
      return this.holding.canRemove;
    },

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

  .left, .right {
    flex: 1;
    display: flex;
  }

  .center {
    flex: none;
    display: flex;
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

