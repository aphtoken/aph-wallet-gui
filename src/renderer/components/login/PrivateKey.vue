<template>
  <section id="login--saved-wallet">
    <login-form-wrapper identifier="openPrivateKey" :on-submit="login">
      <aph-input :hasError="$isFailed('openPrivateKey')" v-model="wif" placeholder="Enter WIF" type="password"></aph-input>
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
      return this.$isPending('openPrivateKey') ? this.$t('loggingIn') : this.$t('login');
    },

    shouldDisableLoginButton() {
      return this.$isPending('openPrivateKey') || this.wif.length === 0;
    },
  },

  data() {
    return {
      wif: '',
    };
  },

  methods: {
    login() {
      if (!this.$isPending('openPrivateKey')) {
        this.$store.dispatch('openPrivateKey', {
          wif: this.wif,
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


