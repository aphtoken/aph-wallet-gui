<template>
  <section id="login--saved-wallet">
    <login-form-wrapper identifier="openSavedWallet">
      <aph-select v-model="wallet" :options="wallets" placeholder="Select a wallet"></aph-select>
      <aph-input :hasError="$isFailed('openSavedWallet')" v-model="passphrase" placeholder="Enter your passphrase here" type="password"></aph-input>
      <button class="login" @click="login" :disabled="shouldDisableLoginButton">{{ buttonLabel }}</button>
    </login-form-wrapper>
  </section>
</template>

<script>
import LoginFormWrapper from './LoginFormWrapper';

export default {
  components: {
    LoginFormWrapper,
  },

  computed: {
    buttonLabel() {
      return this.$isPending('openSavedWallet') ? 'Logging in...' : 'Login';
    },

    shouldDisableLoginButton() {
      return this.$isPending('openSavedWallet') || !this.wallet || this.passphrase.length === 0;
    },

    showButton() {
      return this.passphrase.length > 0 && this.showPassphrase;
    },

    showPassphrase() {
      return !_.isNull(this.wallet);
    },

    wallets() {
      return this.$store.state.wallets.map((wallet) => {
        return _.set(wallet, 'value', wallet.label);
      });
    },
  },

  data() {
    return {
      passphrase: '',
      wallet: null,
    };
  },

  methods: {
    login() {
      this.$store.dispatch('openSavedWallet', {
        name: this.wallet,
        passphrase: this.passphrase,
        done: () => {
          this.$router.push('/authenticated/dashboard');
        },
      });
    },
  },
};
</script>

<style lang="scss">
#login--saved-wallet {
  max-width: toRem(400px);
  width: 60%;

  .aph-input {
    margin-top: $space-lg;
  }

  .login {
    @extend %btn-outline;

    margin-top: $space-lg;
  }
}
</style>


