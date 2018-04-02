<template>
  <div id="login--saved-wallet">
    <aph-input v-model="wif" placeholder="Enter your private key here (WIF)" type="password"></aph-input>
    <div v-if="showButton" class="login" @click="login">Login</div>
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

  methods: {
    login() {
      this.$services.wallets.openWIF(this.wif)
        .then(() => {
          this.$router.push('/authenticated/dashboard');
        })
        .catch(() => {
          this.creating = false;
        });
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


