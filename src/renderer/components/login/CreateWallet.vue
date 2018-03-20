<template>
  <div id="login--create-wallet">
    <p class="help-text">Choose a name for your new wallet:</p>
    <aph-input v-model="walletName" placeholder="Enter your wallet name here"></aph-input>
    <p class="help-text">Choose a passphrase to encrypt your private key:</p>
    <aph-input v-model="passphrase" placeholder="Enter your passphrase here" type="password"></aph-input>
    <aph-input v-model="passphraseConfirm" placeholder="Repeat your passphrase here" type="password"></aph-input>
    <div v-if="showButton" class="create" @click="create">Create</div>
  </div>
</template>

<script>
export default {
  computed: {
    passphrasesMatch() {
      return this.passphrase === this.passphraseConfirm;
    },

    showButton() {
      return this.passphrase.length > 0 && this.walletName.length > 0 && this.passphrasesMatch;
    },
  },

  data() {
    return {
      creating: false,
      passphrase: '',
      passphraseConfirm: '',
      walletName: '',
    };
  },

  methods: {
    create() {
      this.creating = true;

      this.$services.neo.createWallet(this.walletName, this.passphrase, this.passphraseConfirm)
        .then((walletName) => {
          this.creating = false;

          this.$router.push({
            path: '/login/wallet-created',
            query: { walletName },
          });
        })
        .catch(() => {
          this.creating = false;
        });
    },
  },
};
</script>

<style lang="scss">
#login--create-wallet {
  width: 20rem;

  .help-text {
    color: white;
    font-size: $font-size-xsm;
  }

  .aph-text-input {
    margin-top: $space-lg;

    & + .help-text {
      margin-top: $space-xl;
    }
  }

  .create {
    @extend %btn-outline;

    margin-top: $space-lg;
  }
}
</style>


