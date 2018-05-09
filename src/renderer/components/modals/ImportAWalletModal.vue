<template>
  <modal-wrapper id="aph-import-a-wallet-modal" identifier="importWallet">
    <div class="body">
      <aph-icon name="wallet"></aph-icon>
      <aph-input placeholder="Name" v-model="walletName"></aph-input>
      <aph-input placeholder="Private key" v-model="wif"></aph-input>
      <aph-input placeholder="Passphrase" v-model="passphrase" type="password"></aph-input>
    </div>
    <div class="footer">
      <div class="cancel-btn" @click="onCancel">Cancel</div>
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
      return this.$isPending('importWallet') ? 'Saving...' : 'Import';
    },

    shouldDisableSaveButton() {
      return this.$isPending('importWallet') || this.wif.length === 0
        || this.walletName.length === 0 || this.passphrase.length === 0;
    },
  },

  data() {
    return {
      passphrase: '',
      walletName: '',
      wif: '',
    };
  },

  methods: {
    save() {
      if (this.$isPending('importWallet')) {
        return;
      }

      this.$store.dispatch('importWallet', {
        done: () => {
          this.onCancel();
        },
        name: this.walletName,
        passphrase: this.passphrase,
        wif: this.wif,
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

