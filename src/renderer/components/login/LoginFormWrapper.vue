<template>
  <div :class="['login-form-wrapper', {failed}]">
    <aph-form :on-submit="onSubmit">
      <slot></slot>
    </aph-form>
    <request-error-message v-if="identifier" :identifier="identifier"></request-error-message>
  </div>
</template>

<script>
import RequestErrorMessage from '../RequestErrorMessage';

export default {
  components: {
    RequestErrorMessage,
  },

  computed: {
    failed() {
      return this.$isFailed(this.identifier);
    },
  },

  props: {
    identifier: {
      type: String,
    },

    onSubmit: {
      type: Function,
    },
  },
};
</script>


