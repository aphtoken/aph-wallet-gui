<template>
  <section id="login--create-wallet">
    <login-form-wrapper identifier="createWallet" :on-submit="create">
      <p class="help-text">{{$t('chooseAName')}}</p>
      <aph-input v-model="walletName" :placeholder="$t('enterYourWalletName')"></aph-input>
      <p class="help-text">{{$t('chooseAPassphrase')}}</p>
      <aph-input v-model="passphrase" :placeholder="$t('enterYourPassphrase')" type="password"></aph-input>
      <aph-input v-model="passphraseConfirm" :placeholder="$t('repeatYourPassphrase')" type="password"></aph-input>
      <button class="create" :disabled="shouldDisableCreateButton">{{ buttonLabel }}</button>
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
      return this.$isPending('createWallet') ? this.$t('creating') : this.$t('create');
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


