<template>
  <section id="login--saved-wallet">
    <login-form-wrapper identifier="openPrivateKey">
      <aph-input :hasError="$isFailed('openPrivateKey')" v-model="wif" placeholder="Enter your private key here (WIF)" type="password"></aph-input>
      <button class="login" @click="login" :disabled="shouldDisableLoginButton">Login</button>
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
    shouldDisableLoginButton() {
      return this.wif.length === 0;
    },
  },

  data() {
    return {
      wif: '',
    };
  },

  methods: {
    login() {
      this.$store.dispatch('openPrivateKey', {
        done: () => {
          this.$router.push('/authenticated/dashboard');
        },
        wif: this.wif,
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

    margin-top: $space-xl;
  }
}
</style>


