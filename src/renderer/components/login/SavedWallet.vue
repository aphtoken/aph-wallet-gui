<template>
  <div id="login--saved-wallet">
    <aph-select v-model="wallet" :options="wallets" placeholder="Select a wallet"></aph-select>
    <aph-input v-model="passphrase" placeholder="Enter your passphrase here" 
               type="password" @enter="login" ref="password"></aph-input>
    <button class="login" @click="login" :disabled="authenticating"
            :class="['login', {hidden: showButton === false}]">{{ buttonLabel }}</button>
  </div>
</template>

<script>
import Vue from 'vue';
export default {
  computed: {
    buttonLabel() {
      return this.authenticating ? 'Logging in...' : 'Login';
    },

    showButton() {
      return this.passphrase.length > 0 && this.showPassphrase;
    },

    showPassphrase() {
      return !_.isNull(this.wallet);
    },
  },

  data() {
    return {
      authenticating: false,
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

      this.authenticating = true;

      setTimeout(() => {
        /* don't know how to make this behave using async/await as you described,
        how to we get back the error messages?
        Still not sure why the Promise model would freeze the UI */
        this.$services.wallets.openSavedWallet(this.wallet.label, this.passphrase)
          .then(() => {
            this.$router.push('/authenticated/dashboard');
          })
          .catch((e) => {
            this.authenticating = false;
            this.$services.alerts.exception(e);
          });
      }, 100);
    },
  },

  mounted() {
    this.wallets = this.$services.wallets.getAllAsArray();
  },

  watch: {
    wallet() {
      this.passphrase = '';
      if (this.wallet) {
        const self = this;
        Vue.nextTick(() => {
          self.$refs.password.focus();
        });
      }
    },
  },
};
</script>

<style lang="scss">
#login--saved-wallet {
  max-width: toRem(350px);
  width: 50%;

  .aph-input {
    margin-top: $space-lg;
  }

  .login {
    @extend %btn-outline;
    margin-top: $space-lg;
  }
}
</style>


