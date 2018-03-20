<template>
  <div id="login--saved-wallet">
    <aph-input v-model="passphrase" placeholder="Enter your passphrase here" type="password"></aph-input>
    <aph-input v-model="encryptedKey" placeholder="Enter your encrypted key here" type="password"></aph-input>
    <div v-if="showButton" class="login" @click="login">Login</div>
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

  methods: {
    login() {
      this.$router.push('dashboard/home');
    },
  },
};
</script>

<style lang="scss">
#login--saved-wallet {
  width: 20rem;

  .aph-text-input {
    margin-top: $space-lg;
  }

  .login {
    @extend %btn-outline;

    margin-top: $space-lg;
  }
}
</style>


