<template>
  <section id="login--create-wallet">
    <login-form-wrapper identifier="createWallet">
      <p class="help-text">Choose a name for your new wallet:</p>
      <aph-input v-model="walletName" placeholder="Enter your wallet name here"></aph-input>
      <p class="help-text">Choose a passphrase to encrypt your private key:</p>
      <aph-input v-model="passphrase" placeholder="Enter your passphrase here" type="password"></aph-input>
      <aph-input v-model="passphraseConfirm" placeholder="Repeat your passphrase here" type="password"></aph-input>
      <button class="create" @click="create" :disabled="shouldDisableCreateButton">{{ buttonLabel }}</button>
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
      return this.$isPending('createWallet') ? 'Creating...' : 'Create';
    },

    passphrasesMatch() {
      return this.passphrase === this.passphraseConfirm;
    },

    shouldDisableCreateButton() {
      return this.$isPending('createWallet') || this.passphrase.length === 0
        || this.walletName.length === 0 || !this.passphrasesMatch;
    },
  },

  data() {
    return {
      passphrase: '',
      passphraseConfirm: '',
      walletName: '',
    };
  },

  methods: {
    create() {
      this.$store.dispatch('createWallet', {
        name: this.walletName,
        passphrase: this.passphrase,
        passphraseConfirm: this.passphraseConfirm,
      });
    },
  },
};
</script>

<style lang="scss">
#login--create-wallet {
  max-width: toRem(400px);
  width: 60%;

  .help-text {
    color: white;
    font-family: Gilroy;
    font-size: toRem(12px);
  }

  .aph-input {
    margin-top: $space-lg;

    & + .help-text {
      margin-top: $space-xl;
    }
  }

  .create {
    @extend %btn-outline;

    margin-top: $space-xl;
  }
}
</style>


