<template>
  <form class="aph-form" @submit.prevent="handleOnSubmit" @keyup.enter="handleOnSubmit">
    <slot></slot>
  </form>
</template>

<script>
export default {
  methods: {
    handleOnSubmit() {
      this.onSubmit();
    },
  },

  props: {
    onSubmit: {
      default() {
        return _.noop;
      },

      type: Function,
    },
  },
};
</script>

