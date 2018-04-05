<template>
  <div id="login--saved-wallet">
    <aph-input v-model="passphrase" placeholder="Enter your passphrase here" type="password" ref="password"></aph-input>
    <aph-input v-model="encryptedKey" placeholder="Enter your encrypted key here" type="password" @enter="login"></aph-input>
    <div @click="login" :class="['login', {hidden: showButton === false}]">Login</div>
  </div>
</template>

<script>
export default {
  computed: {
    showButton() {
      return this.passphrase.length > 0 && this.encryptedKey.length > 0;
    },
  },

  data() {
    return {
      encryptedKey: '',
      passphrase: '',
    };
  },

  mounted() {
    this.$refs.password.focus();
  },

  methods: {
    login() {
      this.$services.wallets.openEncryptedKey(this.encryptedKey, this.passphrase)
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


