<template>
  <div :class="['aph-select', {'is-open': isOpen, 'is-light': light}]">
    <button type="button" class="aph-select--label" :disabled="isDisabled" :title="disabledTooltip" @click="toggleOpen">{{ label }}</button>
    <ul class="aph-select--dropdown" v-if="isOpen">
      <li :class="{selected: isSelected(option)}" v-for="(option, index) in options" :key="index" @click="toggleSelectedOption(option)">{{ option.label }}</li>
    </ul>
    <aph-icon :name="iconName"></aph-icon>
  </div>
</template>

<script>
export default {
  beforeDestroy() {
    document.removeEventListener('click', this.close);
  },

  beforeMount() {
    document.addEventListener('click', (e) => {
      if (!this.$el || !this.$el.contains(e.target)) {
        this.close();
      }
    });
  },

  computed: {
    iconName() {
      return this.isOpen ? 'arrow-up' : 'arrow-down';
    },

    label() {
      return this.getSelectedOptionLabel() || this.placeholder;
    },
    disabledTooltip() {
      return this.isDisabled ? this.isDisabledTooltip : '';
    },
  },

  data() {
    return {
      isOpen: false,
      selectedOption: null,
    };
  },

  methods: {
    close() {
      this.isOpen = false;
    },

    getSelectedOptionLabel() {
      const option = _.find(this.options, { value: this.selectedOption });
      return option ? option.label : null;
    },

    isSelected({ value }) {
      return this.selectedOption === value;
    },

    toggleOpen() {
      this.isOpen = !this.isOpen;
    },

    toggleSelectedOption(option) {
      this.selectedOption = this.allowEmptyValue && this.isSelected(option) ? null : option.value;
      this.$emit('input', this.selectedOption);
      this.close();
    },
  },

  mounted() {
    if (this.value && this.value.value) {
      this.selectedOption = this.value.value;
    } else if (this.value) {
      this.selectedOption = this.value;
    } else if (this.initialValue && this.initialValue.value) {
      this.selectedOption = this.initialValue.value;
    } else if (this.initialValue) {
      this.selectedOption = this.initialValue;
    }
  },

  props: {
    value: {
      default: null,
    },

    allowEmptyValue: {
      default: false,
      type: Boolean,
    },

    initialValue: {
      default: null,
    },

    light: {
      default: false,
      type: Boolean,
    },

    options: {
      default() {
        return [];
      },
      type: Array,
    },

    placeholder: {
      default() {
        return this.$t('noOptionSelected');
      },
      type: String,
    },
    isDisabled: {
      default: false,
      type: Boolean,
    },
    isDisabledTooltip: {
      default: '',
      type: String,
    },
  },
};
</script>

<style lang="scss">
.aph-select {
  display: block;
  position: relative;
  width: 100%;

  * {
    user-select: none;
  }

  .aph-icon {
    position: absolute;
    right: $space;
    top: 50%;
    transform: translate(-50%, -50%);

    svg {
      height: $space-sm;
    }

    path {
      fill: white;
    }
  }

  &.is-open {
    .aph-select--label {
      background: $purple-hover;
      border-color: $purple-hover;
    }

    .aph-icon {
      svg {
        transform: translate(-20.5 -22.5);
      }
    }
  }

  .aph-select--label {
    background: $purple;
    border-color: transparent;
    border-radius: $border-radius;
    border: $border;
    color: white;
    cursor: pointer;
    font-family: GilroyMedium;
    font-size: toRem(13px);
    height: $input-height;
    padding: toRem(16px) 0;
    text-align: center;
    transition: all .1s linear;
    white-space: nowrap;
    outline:none;
    width: 100%;

    &:hover {
      background: $purple-hover;
      border-color: $purple-hover;
    }
  }

  .aph-select--dropdown {
    background: $light-grey;
    color: $purple;
    border-radius: $border-radius;
    left: 0;
    list-style-type: none;
    margin: $space 0 0;
    max-height: toRem(600px);
    overflow-x: auto;
    padding: 0;
    position: absolute;
    top: 100%;
    width: 100%;
    z-index: 100;
    box-shadow: $box-shadow;

    > li {
      cursor: pointer;
      font-size: toRem(16px);
      height: $button-height;
      line-height: $button-height;
      padding: 0 $space;
      transition: all .1s linear;

      &:hover,
      &.selected {
        background: $purple;
        color: #FFF;
      }

      &:first-child {
        border-top-left-radius: $border-radius;
        border-top-right-radius: $border-radius;
      }

      &:last-child {
        border-bottom-left-radius: $border-radius;
        border-bottom-right-radius: $border-radius;
        border-bottom:0;
      }
    }
  }

  &.is-light {
    .aph-select--label {
      background: $background;
      border-color: transparent;
      color: $dark;
      text-align: left;
      padding: toRem(16px) $space;
    }

    .aph-select--dropdown {
      border: $border-width solid $background;
    }

    .aph-icon .fill {
      fill: $dark;
    }
  }
}
</style>
