<template>
  <section id="login--saved-wallet">
    <login-form-wrapper identifier="openSavedWallet">
      <div v-if="wallets.length > 0">
        <aph-select v-model="wallet" :options="wallets" :placeholder="$t('selectAWallet')"></aph-select>
        <aph-input :hasError="$isFailed('openSavedWallet')" v-model="passphrase" :placeholder="$t('enterYourPassphrase')" type="password"></aph-input>
        <button class="login" @click="login" :disabled="shouldDisableLoginButton">{{ buttonLabel }}</button>
      </div>
      <div v-else>
        <p class="help-text">{{$t('noSavedWallets')}}</p>
        <button class="login" @click="create">{{$t('createAWallet')}}</button>
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
      return this.$isPending('openSavedWallet') ? this.$t('loggingIn') : this.$t('login');
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
    create() {
      this.$router.push('/login/create-wallet');
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


