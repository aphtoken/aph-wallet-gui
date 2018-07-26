<template>
  <modal-wrapper id="aph-import-a-wallet-modal" identifier="importWallet">
    <div class="body">
      <aph-form :on-submit="save">
        <aph-icon name="wallet"></aph-icon>
        <aph-input :placeholder="$t('name')" v-model="walletName"></aph-input>
        <aph-input :placeholder="$t('privateKey')" v-model="wif"></aph-input>
        <aph-input :placeholder="$t('passphrase')" v-model="passphrase" type="password"></aph-input>
        <aph-input :placeholder="$t('confirmPassphrase')" v-model="passphraseConfirm" type="password"></aph-input>
      </aph-form>
    </div>
    <div class="footer">
      <div class="cancel-btn" @click="onCancel">{{$t('cancel')}}</div>
      <button class="login-btn" @click="save" :disabled="shouldDisableSaveButton">{{ buttonLabel }}</button>
    </div>
  </modal-wrapper>
</template>

<script>
import ModalWrapper from './ModalWrapper';

export default {
  components: {
    ModalWrapper,
  },

  computed: {
    buttonLabel() {
      return this.$isPending('importWallet') ? this.$t('saving') : this.$t('import');
    },

    passphrasesMatch() {
      return this.passphrase === this.passphraseConfirm;
    },

    shouldDisableSaveButton() {
      return this.$isPending('importWallet') || this.wif.length === 0
        || this.walletName.length === 0 || this.passphrase.length === 0
        || !this.passphrasesMatch;
    },
  },

  data() {
    return {
      passphrase: '',
      passphraseConfirm: '',
      walletName: '',
      wif: '',
    };
  },

  methods: {
    save() {
      if (!this.passphrase || !this.passphraseConfirm || !this.walletName || !this.wif) {
        return;
      }

      if (this.$isPending('importWallet')) {
        return;
      }

      this.$store.dispatch('importWallet', {
        name: this.walletName,
        wif: this.wif,
        passphrase: this.passphrase,
        done: () => {
          this.onCancel();
        },
      });
    },
  },

  props: {
    onCancel: {
      required: true,
      type: Function,
    },
  },
};
</script>


<style lang="scss">
#aph-import-a-wallet-modal {
  .body {
    padding: $space-xl $space-lg $space-lg;
    text-align: center;
    display: block;

    .aph-icon {
      .wallet {
        height: toRem(44px);
        margin-bottom: $space-xl;
      }
    }

    .aph-input {
      border-color: $grey;
      height: 50px;
      width: 100%;

      &.focused {
        border-color: $purple;
      }

      input {
        color: $dark;
      }

      .aph-icon {
        .fill {
          fill: $dark;
        }
      }

      .placeholder {
        color: $grey;
        font-family: GilroyMedium;
      }

      & + .aph-input {
        margin-top: $space;
      }
    }
  }


  .footer {
    display: flex;

    > * {
      flex: 1;
    }
  }

  .cancel-btn {
    @extend %btn-footer-light;

    border-bottom-left-radius: $border-radius;
  }

  .login-btn {
    @extend %btn-footer;

    border-bottom-right-radius: $border-radius;
  }
}
</style>

