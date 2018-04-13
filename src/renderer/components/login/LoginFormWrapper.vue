<template>
  <div :class="['login-form-wrapper', {failed}]">
    <slot></slot>
    <div v-if="hasErrorMessage" class="request-status-message">
      <aph-icon name="unconfirmed"></aph-icon>
      <div class="right">{{ message }}</div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    failed() {
      return this.$isFailed(this.identifier);
    },

    hasErrorMessage() {
      return this.failed && this.message;
    },

    message() {
      return this.$store.state.requests[this.identifier].message;
    },
  },

  props: {
    identifier: {
      type: String,
    },
  },
};
</script>

<style lang="scss">
.login-form-wrapper {
  .request-status-message {
    align-items: center;
    background: rgba(black, 0.7);
    display: flex;
    margin-top: $space-lg;
    padding: $space-lg;

    .aph-icon {
      flex: none;

      svg {
        height: toRem(50px);
      }

      .fill {
        fill: $red;
      }

      .stroke {
        stroke: $red;
      }
    }

    .right {
      margin-left: $space;
      color: $red;
      flex: 1;
    }
  }
}
</style>


