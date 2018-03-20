<template>
  <div class="aph-balance">
    <span class="symbol">$</span>
    <span class="amount">{{ amount }}</span>
    <span class="currency">USD</span>
  </div>
</template>

<script>
export default {
  computed: {
    formattedAmount() {
      return this.amount;
    },
  },

  props: [
    'amount',
  ],
};
</script>

<style lang="scss">
.aph-balance {
  .symbol {
    font-size: $font-size-xl;
  }

  .amount {
    font-family: GilroyMedium;
    font-size: $font-size-xxl;
  }

  .currency {
    font-size: $font-size-xl;
    margin-left: $space-sm;
  }
}
</style>


