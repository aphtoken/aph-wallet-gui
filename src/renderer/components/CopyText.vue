<template>
  <span class="aph-copy-text" @click.stop="copy">
    <aph-icon name="copy" ref="icon"></aph-icon>
    <span :class="['confirmation-text', {show: showConfirmationText}]" ref="confirmationText">Copied</span>
  </span>
</template>

<script>
import { clipboard } from 'electron';

const SHOW_CONFIRMATION_DELAY = 50;
const SHOW_CONFIRMATION_TIMEOUT = 1000;

export default {
  data() {
    return {
      showConfirmationText: false,
    };
  },

  methods: {
    copy(e) {
      this.position(e);
      clipboard.writeText(this.text);

      setTimeout(() => {
        this.showConfirmationText = true;
      }, SHOW_CONFIRMATION_DELAY);

      setTimeout(() => {
        this.showConfirmationText = false;
      }, SHOW_CONFIRMATION_TIMEOUT);
    },

    position({ clientX, clientY }) {
      const child = this.$refs.confirmationText;

      child.style.left = `${clientX}px`;
      child.style.top = `${clientY}px`;
    },
  },

  props: {
    text: {
      type: String,
    },
  },
};
</script>

<style lang="scss">
.aph-copy-text {
  color: $grey;
  display: inline-block;
  font-weight: bold;
  position: relative;

  .aph-icon {
    cursor: pointer;
    min-height: auto;

    path {
      fill: $grey;
    }

    svg {
      height: $space;
    }
  }

  .confirmation-text {
    color: $purple;
    display: inline-block;
    font-family: GilroyMedium;
    font-size: toRem(12px);
    opacity: 1;
    position: fixed;
    transform: translate(-50%, -10px);
    visibility: hidden;
    z-index: -1;

    &.show {
      opacity: 0;
      transform: translate(-50%, -20px);
      transition: all 0.5s;
      visibility: visible;
      z-index: 100000;
    }
  }

  &:hover {
    path {
      fill: $purple;
    }
  }
}
</style>
