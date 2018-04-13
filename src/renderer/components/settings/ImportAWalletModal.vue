<template>
  <div id="aph-import-a-wallet-modal">
    <div class="content">
      <div class="body">
        <aph-input placeholder="Name this Wallet" :light="true" v-model="walletName"></aph-input>
        <aph-input placeholder="Private key (WIF)" :light="true" v-model="wif"></aph-input>
        <aph-input placeholder="Create a Passphrase" :light="true" v-model="passphrase" type="password"></aph-input>
      </div>
      <div class="footer">
        <div class="cancel-btn" @click="onCancel">Cancel</div>
        <button class="login-btn" @click="save" :disabled="shouldDisableSaveButton">{{ buttonLabel }}</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    onCancel: {
      required: true,
      type: Function,
    },
  },

  data() {
    return {
      walletName: '',
      wif: '',
      passphrase: '',
    };
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

  methods: {
    save() {
      if (this.$isPending('importWallet')) {
        return;
      }

      this.$store.dispatch('importWallet', {
        name: this.walletName,
        wif: this.wif,
        passphrase: this.passphrase,
        done: () => {
          this.$services.alerts.success(`Imported Wallet ${this.walletName}`);
          this.onCancel();
        },
      });
    },
  },
};
</script>


<style lang="scss">
#aph-import-a-wallet-modal {
  align-items: center;
  background: rgba($dark, 0.8);
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 9999;

  .content {
    background: white;
    flex: none;
    width: toRem(600px);
  }

  .body {
    padding: $space-lg;
    text-align: center;
    display: block;

    .aph-icon {
      margin-bottom: $space-lg;

      svg {
        height: $space-xl;
      }
    }

    .aph-input {
      border-color: $dark;
      height: 50px;
      width: 100%;

      &.focused {
        border-color: $purple;
      }

      input {
        color: $dark;
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
  }

  .login-btn {
    @extend %btn-footer;
  }
}
</style>

