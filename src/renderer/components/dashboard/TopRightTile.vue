<template>
  <price v-if="$store.state.showPriceTile"></price>
  <transaction-detail v-else></transaction-detail>
</template>

<script>
import Price from './Price';
import TransactionDetail from './TransactionDetail';

export default {
  components: {
    Price,
    TransactionDetail,
  },
};
</script>

