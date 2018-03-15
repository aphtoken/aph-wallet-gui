<template>
  <div id="login--saved-wallet">
    <aph-input v-model="passphrase" placeholder="Enter your passphrase here" type="password"></aph-input>
    <aph-select v-model="wallet" :options="wallets" placeholder="Select a wallet"></aph-select>
    <div v-if="showButton" class="login">Login</div>
  </div>
</template>

<script>
export default {
  computed: {
    showButton() {
      return this.passphrase.length > 0 && !_.isNull(this.wallet);
    },
  },

  data() {
    return {
      passphrase: '',
      wallet: null,
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
#login--saved-wallet {
  width: 20rem;

  .aph-text-input {
    margin-bottom: $space-lg;
  }

  .login {
    @extend %btn-outline;

    margin-top: $space-lg;
  }
}
</style>


