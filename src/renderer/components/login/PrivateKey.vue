<template>
  <div id="login--saved-wallet">
    <aph-input v-model="wif" placeholder="Enter your private key here (WIF)" type="password" ref="password" @enter="login"></aph-input>
    <div :class="['login', {hidden: showButton === false}]" @click="login">Login</div>
  </div>
</template>

<script>
export default {
  computed: {
    showButton() {
      return this.wif.length > 0;
    },
  },

  data() {
    return {
      wif: '',
    };
  },

  mounted() {
    this.$refs.password.focus();
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


