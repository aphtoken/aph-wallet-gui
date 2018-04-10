<template>
  <div :class="['aph-input', {focused: isFocused || value.length > 0}]">
    <input :type="computedType" @input="onInput" v-bind:value="value" @keyup.enter="onEnter" :disabled="disabled" @blur="onBlur" @focus="onFocus" ref="input"/>
    <div v-if="type === 'password'" class="visibility-toggle" @click="toggleIsVisible">
      <aph-icon :name="iconName"></aph-icon>
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
      return this.isVisible ? 'remove' : 'add';
    },
  },

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
  border-bottom: $border;
  border-color: white;
  display: flex;
  height: $input-height;
  position: relative;
  transition: $transition;

  input {
    background: none;
    border: none;
    color: white;
    font-size: toRem(14px);
    letter-spacing: .5px;
    outline: none;
    padding: $space-sm 0;
    width: 100%;
  }

  .placeholder {
    color: white;
    padding-top: toRem(12px);
    pointer-events: none;
    position: absolute;
    top: 0;
    transition: $transition-fast;
    z-index: 0;
  }

  .visibility-toggle {
    cursor: pointer;
    padding: $space;
  }

  .aph-icon {
    svg {
      height: $space * .8;
    }

    path {
      fill: white;
    }
  }

  &.focused {
    border-color: $purple;

    .placeholder {
      color: $grey;
      font-size: toRem(12px);
      top: toRem(-18px);
    }
  }
}
.content {
  .placeholder {
    color: grey;
  }
}
</style>


