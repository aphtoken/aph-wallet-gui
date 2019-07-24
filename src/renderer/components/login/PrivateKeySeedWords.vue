<template>
  <section id="login--saved-wallet">
    <login-form-wrapper identifier="openPrivateKeySeedWords" :on-submit="login">
      <aph-input :hasError="$isFailed('openPrivateKeySeedWords')" v-model="wif" placeholder="Entert WIF" type="password"></aph-input>
      <aph-input :hasError="$isFailed('openPrivateKeySeedWords')" v-model="seedwords" placeholder="Enter Mnemonic Words" type="text"></aph-input>
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
      return this.$isPending('openPrivateKeySeedWords') ? this.$t('loggingIn') : this.$t('login');
    },

    shouldDisableLoginButton() {
      return this.$isPending('openPrivateKeySeedWords') || this.wif.length === 0 || this.seedwords.length === 0;
    },
  },

  data() {
    return {
      wif: '',
      seedwords: '',
    };
  },

  methods: {
    login() {
      if (!this.$isPending('openPrivateKeySeedWords')) {
        this.$store.dispatch('openPrivateKeySeedWords', {
          wif: this.wif,
          seedwords: this.seedwords,
          done: () => {
            this.$router.push('/authenticated/dashboard');
          },
        });
      }
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

    margin-top: $space-xl;
  }
}
</style>


