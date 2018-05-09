<template>
  <section id="login--saved-wallet">
    <login-form-wrapper identifier="openSavedWallet">
      <div v-if="wallets.length > 0">
        <aph-select v-model="wallet" :options="wallets" placeholder="Select a wallet"></aph-select>
        <aph-input :hasError="$isFailed('openSavedWallet')" v-model="passphrase" placeholder="Enter your passphrase here" type="password"></aph-input>
        <button class="login" @click="login" :disabled="shouldDisableLoginButton">{{ buttonLabel }}</button>
      </div>
      <div v-else>
        <p class="help-text">You do not have any saved wallets. Create one?</p>
        <button class="login" @click="create">Create a Wallet</button>
      </div>
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
    create() {
      this.$router.push('/login/create-wallet');
    },

    login() {
      this.$store.dispatch('openSavedWallet', {
        done: () => {
          this.$router.push('/authenticated/dashboard');
        },
        name: this.wallet,
        passphrase: this.passphrase,
      });
    },
  },
};
</script>

<style lang="scss">
#login--saved-wallet {
  max-width: toRem(400px);
  width: 60%;

  .help-text {
    color: white;
    font-family: Gilroy;
    font-size: toRem(12px);
    text-align: center;
  }

  .aph-input {
    margin-top: $space-lg;
  }

  .login {
    @extend %btn-outline;

    margin-top: $space-xl;
  }
}
</style>


