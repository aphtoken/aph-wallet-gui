<template>
  <div class="aph-modal-wrapper">
    <div class="content" :style="{ width: dialogWidth }">
      <slot></slot>
    </div>
    <request-error-message v-if="identifier" :identifier="identifier"></request-error-message>
  </div>
</template>

<script>
import RequestErrorMessage from '../RequestErrorMessage';

export default {
  beforeDestroy() {
    if (this.identifier) {
      this.$store.commit('endRequest', { identifier: this.identifier });
    }
  },

  components: {
    RequestErrorMessage,
  },

  props: {
    identifier: {
      type: String,
    },
    dialogWidth: {
      default: '400px',
      type: String,
    },
  },
};
</script>

<style lang="scss">
.aph-modal-wrapper {
  align-items: center;
  background: rgba($dark, 0.8);
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 2000;

  > .content {
    background: white;
    border-radius: $border-radius;
    flex: none;
  }

  > .aph-request-status-message {
    width: toRem(400px);
  }
}
</style>


