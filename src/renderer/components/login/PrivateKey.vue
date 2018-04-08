<template>
  <section id="login--saved-wallet">
    <aph-input v-model="wif" placeholder="Enter your private key here (WIF)" type="password"></aph-input>
    <button class="login" @click="login" :disabled="shouldDisableLoginButton">Login</button>
  </section>
</template>

<script>
export default {
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
      this.$services.wallets.openWIF(this.wif)
        .then(() => {
          this.$router.push('/authenticated/dashboard');
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
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


