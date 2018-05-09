<template>
  <div :class="['aph-input', {focused: isFocused || value.length > 0, 'has-error': hasError}]">
    <input :type="computedType" @input="onInput" v-bind:value="value" @keyup.enter="onEnter" :disabled="disabled" @blur="onBlur" @focus="onFocus" ref="input"/>
    <div v-if="type === 'password'" class="visibility-toggle" @click="toggleIsVisible">
      <aph-icon :name="iconName" :title="iconTitle"></aph-icon>
    </div>
    <div class="placeholder" v-if="placeholder">{{ placeholder }}</div>
  </div>
</template>

<script>
export default {
  computed: {
    computedType() {
      return this.type === 'password' && this.isVisible ? 'text' : this.type;
    },

    iconName() {
      return this.isVisible ? 'eye-closed' : 'eye-open';
    },

    iconTitle() {
      return this.isVisible ? 'Hide Password' : 'Show Password';
    },
  },

  data() {
    return {
      isFocused: false,
      isVisible: false,
    };
  },

  methods: {
    focus() {
      this.$refs.input.focus();
    },

    onBlur() {
      this.isFocused = false;
    },

    onEnter(event) {
      this.$emit('enter', event.target.value);
    },

    onFocus() {
      this.isFocused = true;
    },

    onInput(event) {
      this.$emit('input', event.target.value);
    },

    toggleIsVisible() {
      this.isVisible = !this.isVisible;
    },
  },

  props: {
    disabled: {
      default: false,
      type: Boolean,
    },

    hasError: {
      type: Boolean,
    },

    placeholder: {
      type: String,
    },

    type: {
      default: 'text',
      type: String,
    },

    value: {
      default: '',
      type: String,
    },
  },
};
</script>

<style lang="scss">
.aph-input {
  align-items: center;
  border-bottom: $border-thin;
  border-color: white;
  display: flex;
  height: $input-height;
  position: relative;

  input {
    background: none;
    border: none;
    color: white;
    font-size: toRem(14px);
    letter-spacing: toRem(0.5px);
    outline: none;
    padding: $space 0 $space-sm;
    width: 100%;
  }

  .placeholder {
    @include transitionFast(all);

    color: white;
    padding-top: toRem(20px);
    pointer-events: none;
    position: absolute;
    top: 0;
    z-index: 0;
  }

  .visibility-toggle {
    cursor: pointer;
    padding: $space;
  }

  .aph-icon {
    svg {
      height: toRem(17px);
    }

    .fill {
      fill: white;
    }
  }

  &.focused {
    border-color: $purple;

    .placeholder {
      color: $grey;
      font-size: toRem(12px);
      padding: 0;
      top: 0;
    }
  }

  &.has-error {
    border-color: $red;
  }
}
.content {
  .placeholder {
    color: grey;
  }
}
</style>


