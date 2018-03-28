<template>
  <div class="aph-input">
    <input :type="computedType" :placeholder="placeholder" @input="onInput" v-bind:value="value" />

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
      isVisible: false,
    };
  },

  methods: {
    onInput(event) {
      this.$emit('input', event.target.value);
    },

    toggleIsVisible() {
      this.isVisible = !this.isVisible;
    },
  },

  props: {
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
  display: flex;
  height: $input-height;
  line-height: $input-height;
  position: relative;

  input {
    background: none;
    border: none;
    color: white;
    font-size: toRem(14px);
    letter-spacing: .5px;
    outline: none;
    width: 100%;

    &::placeholder {
      color: white;
    }
  }

  .visibility-toggle {
    bottom: 0;
    cursor: pointer;
    padding: $space;
    position: absolute;
    right: 0;
    top: 0;
  }

  .aph-icon {
    svg {
      height: $space * .8;
    }

    path {
      fill: white;
    }
  }
}
</style>


