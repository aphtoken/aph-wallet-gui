<template>
  <holding-summary v-if="$store.state.showSummaryTile"></holding-summary>
  <transaction-detail v-else></transaction-detail>
</template>

<script>
import HoldingSummary from './Summary';
import TransactionDetail from './TransactionDetail';

export default {
  components: {
    HoldingSummary,
    TransactionDetail,
  },
};
</script>
