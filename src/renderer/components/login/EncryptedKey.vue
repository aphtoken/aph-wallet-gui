<template>
  <section id="login--saved-wallet">
    <login-form-wrapper identifier="openEncryptedKey" :on-submit="login">
      <aph-input :hasError="$isFailed('openEncryptedKey')" v-model="passphrase" :placeholder="$t('enterYourPassphrase')" type="password"></aph-input>
      <aph-input :hasError="$isFailed('openEncryptedKey')" v-model="encryptedKey" :placeholder="$t('enterYourEncryptedKey')" type="password"></aph-input>
      <button class="login" @click="login" :disabled="shouldDisableLoginButton">{{$t('login')}}</button>
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
      return this.passphrase.length === 0 || this.encryptedKey.length === 0;
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
      this.$store.dispatch('openEncryptedKey', {
        encryptedKey: this.encryptedKey,
        passphrase: this.passphrase,
        done: () => {
          this.$router.push('/authenticated/dashboard');
        },
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


