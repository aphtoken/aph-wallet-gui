<template>
  <div :class="['aph-dex-input', {focused: isFocused, 'has-error': hasError}]">
    <input :type="type" @input="onInput" v-bind:value="value" @keyup.enter="onEnter" :disabled="disabled" @blur="onBlur" @focus="onFocus" ref="input"/>
    <div class="border"></div>
    <div class="placeholder" v-if="placeholder">{{ placeholder }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isFocused: false,
      isVisible: false,
    };
  },

  methods: {
    onInput(event) {
      this.$emit('input', event.target.value);
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

    toggleIsVisible() {
      this.isVisible = !this.isVisible;
    },

    focus() {
      this.$refs.input.focus();
    },
  },

  props: {
    disabled: {
      default: false,
      type: Boolean,
    },

    placeholder: {
      type: String,
    },

    hasError: {
      type: Boolean,
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
.aph-dex-input {
  display: flex;
  flex-direction: column;

  input {
    background: none;
    border: none;
    color: white;
    font-size: toRem(14px);
    letter-spacing: toRem(0.5px);
    outline: none;
    padding: $space-sm 0;
    width: 100%;
  }

  .border {
    border-bottom: $border-thin;
    border-color: $light-grey;
    margin: $space-sm 0;
  }

  .placeholder {
    @include transitionFast(all);

    color: white;
    pointer-events: none;
    z-index: 0;
  }

  &.focused {
    .border {
      border-color: $purple;
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


