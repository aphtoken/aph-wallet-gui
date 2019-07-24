<template>
  <section id="login--encrypted-key">
    <login-form-wrapper identifier="openEncryptedKey" :on-submit="login">
      <aph-input :hasError="$isFailed('openEncryptedKey')" v-model="passphrase" :placeholder="$t('enterYourPassphrase')" type="password"></aph-input>
      <aph-input :hasError="$isFailed('openEncryptedKey')" v-model="encryptedKey" :placeholder="$t('enterYourEncryptedKey')" type="password"></aph-input>
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
      return this.$isPending('openEncryptedKey') ? this.$t('loggingIn') : this.$t('login');
    },

    shouldDisableLoginButton() {
      return this.$isPending('openEncryptedKey') || this.passphrase.length === 0 || this.encryptedKey.length === 0;
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
      if (!this.$isPending('openEncryptedKey')) {
        this.$store.dispatch('openEncryptedKey', {
          encryptedKey: this.encryptedKey,
          passphrase: this.passphrase,
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
#login--encrypted-key {
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


