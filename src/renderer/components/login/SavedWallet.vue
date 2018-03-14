<template>
  <div id="login--saved-wallet">
    <aph-select :options="wallets"></aph-select>
  </div>
</template>

<script>
export default {
  data() {
    return {
      wallets: [
        {
          label: 'Wallet 1',
          value: 'wallet-1',
        },
        {
          label: 'Wallet 2',
          value: 'wallet-2',
        },
      ],
    };
  },
};
</script>

<style lang="scss">

</style>


