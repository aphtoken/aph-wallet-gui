<template>
  <div :class="['aph-input', {focused: isFocused}]">
    <input :type="computedType" :placeholder="placeholder" @input="onInput" v-bind:value="value" @keyup.enter="onEnter" :disabled="disabled" @blur="onBlur" @focus="onFocus"/>
    <div v-if="type === 'password'" class="visibility-toggle" @click="toggleIsVisible">
      <aph-icon :name="iconName"></aph-icon>
    </div>
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
  },

  props: {
    disabled: {
      default: false,
      type: Boolean,
    },

    placeholder: {
      default: '',
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

    &::placeholder {
      color: white;
    }
  }

  .visibility-toggle {
    // bottom: 0;
    cursor: pointer;
    padding: $space;
    // position: absolute;
    // right: 0;
    // top: 0;
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
  }
}
</style>


