<template>
  <div id="login--saved-wallet">
    <aph-select v-model="wallet" :options="wallets" placeholder="Select a wallet"></aph-select>
    <aph-input v-if="showPassphrase" v-model="passphrase" placeholder="Enter your passphrase here" type="password" @enter="login"></aph-input>
    <div v-if="showButton" class="login" @click="login">Login</div>
  </div>
</template>

<script>
export default {
  computed: {
    showButton() {
      return this.passphrase.length > 0 && this.showPassphrase;
    },

    showPassphrase() {
      return !_.isNull(this.wallet);
    },
  },

  data() {
    return {
      passphrase: '',
      wallet: null,
      wallets: [],
    };
  },

  methods: {
    login() {
      if (_.isNull(this.wallet)) {
        return;
      }

      setTimeout(() => {
        /* don't know how to make this behave using async/await as you described,
        how to we get back the error messages?
        Still not sure why the Promise model would freeze the UI */
        this.$services.wallets.openSavedWallet(this.wallet.label, this.passphrase)
          .then(() => {
            this.$router.push('dashboard');
          })
          .catch((e) => {
            this.$services.alerts.exception(e);
          });
      }, 1000);
    },
  },

  mounted() {
    this.wallets = this.$services.wallets.getAllAsArray();
  },

  watch: {
    wallet() {
      this.passphrase = '';
    },
  },
};
</script>

<style lang="scss">
#login--saved-wallet {
  width: 20rem;

  .aph-input {
    margin-top: $space-lg;
  }

  .login {
    @extend %btn-outline;

    margin-top: $space-lg;
  }
}
</style>


