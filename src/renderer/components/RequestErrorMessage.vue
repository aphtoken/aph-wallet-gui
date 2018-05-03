<template>
  <div class="aph-request-status-message" v-if="hasErrorMessage">
    <aph-icon name="unconfirmed-big"></aph-icon>
    <div class="right">{{ message }}</div>
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
.aph-request-status-message {
  align-items: center;
  background: $dark;
  border-radius: $border-radius;
  display: flex;
  justify-content: center;
  margin-top: $space-lg;
  padding: $space-lg;

  .aph-icon {
    flex: none;

    svg {
      height: toRem(40px);
    }

    .fill {
      fill: $red;
    }
  }

  .right {
    margin-left: $space-lg;
    color: $red;
  }
}
</style>

