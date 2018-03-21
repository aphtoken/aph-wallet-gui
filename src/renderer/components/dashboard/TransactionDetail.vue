<template>
  <div class="transaction-detail">
    <div class="header">
      <h1 class="underlined">Transaction</h1>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    hash: {
      type: String,
    },
  },
};
</script>

<style lang="scss">
.transaction-detail {
  background: white;
  border-radius: $border-radius;
  display: flex;
  flex-direction: column;

  .header {
    padding: $space;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }
}
</style>

