<template>
  <div id="aph-login-to-wallet-modal">
    <div class="content">
      <div v-if="showRemove">
        <div class="body">
          <div class="wallet-name">
            Are you sure you'd like to remove <span>{{$store.state.currentLoginToWallet.label}}</span>?
            <div class="warning">
              <em>Loss of funds is possible</em>, if you have not properly backed up this wallet's keys.
            </div>
          </div>
          <aph-input placeholder="Enter the name of your wallet to delete" :light="true" v-model="confirmWalletName"></aph-input>
        </div>
        <div class="footer">
          <div class="cancel-btn" @click="cancelRemove">Cancel</div>
          <button class="login-btn" @click="remove" :disabled="shouldDisableDeleteButton">Yes, Delete Wallet</button>
        </div>
      </div>
      <div v-else>
        <div class="body">
          <div class="wallet-name">
            <span>{{$store.state.currentLoginToWallet.label}}</span>
          </div>
          <div class="remove-btn" @click="showRemoveConfirmation">Remove</div>
          <aph-input placeholder="Enter your passphrase to login" :light="true" v-model="passphrase" type="password"></aph-input>
        </div>
        <div class="footer">
          <div class="cancel-btn" @click="onCancel">Cancel</div>
          <button class="login-btn" @click="login" :disabled="shouldDisableLoginButton">{{ buttonLabel }}</button>
        </div>
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
      passphrase: '',
      showRemove: false,
      confirmWalletName: '',
    };
  },

  computed: {
    buttonLabel() {
      return this.$isPending('openSavedWallet') ? 'Logging in...' : 'Login';
    },

    shouldDisableLoginButton() {
      return this.$isPending('openSavedWallet') || this.passphrase.length === 0;
    },

    shouldDisableDeleteButton() {
      return this.$isPending('deleteWallet')
        || this.confirmWalletName.toLowerCase() !== this.$store.state.currentLoginToWallet.label.toLowerCase();
    },
  },

  methods: {
    login() {
      if (this.$isPending('openSavedWallet')) {
        return;
      }

      if (this.$store.state.currentLoginToWallet.label === this.$store.state.currentWallet.label) {
        this.$services.alerts.error(`You already have ${this.$store.state.currentLoginToWallet.label} open.`);
        return;
      }

      this.$store.dispatch('openSavedWallet', {
        name: this.$store.state.currentLoginToWallet.label,
        passphrase: this.passphrase,
        done: () => {
          this.$services.alerts.success(`Switched to Wallet ${this.$store.state.currentLoginToWallet.label}`);
          this.onCancel();
        },
      });
    },
    showRemoveConfirmation() {
      this.showRemove = true;
    },
    cancelRemove() {
      this.showRemove = false;
    },
    remove() {
      this.$store.dispatch('deleteWallet', {
        name: this.$store.state.currentLoginToWallet.label,
        passphrase: this.passphrase,
        done: () => {
          this.$services.alerts.success(`Deleted Wallet ${this.$store.state.currentLoginToWallet.label}`);
          if (this.$store.state.currentLoginToWallet.label
            === this.$store.state.currentWallet.label) {
            this.$services.wallets.clearCurrentWallet();
            this.$router.push('/login');
          }
          this.onCancel();
        },
      });
    },
  },
};
</script>


<style lang="scss">
#aph-login-to-wallet-modal {
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
    width: toRem(500px);
  }

  .body {
    padding: $space-lg;
    text-align: center;
    display: block;
    position: relative;

    .aph-icon {
      margin-bottom: $space-lg;

      svg {
        height: $space-xl;
      }
    }

    .wallet-name {
      width: 100%;
      margin-bottom: $space-lg;
      text-align: left;
      line-height: 1.5rem;
      span {
        font-weight: bold;
      }
      em {
        font-weight: bold;
        color: $red;
        font-style: normal;
      }
      .warning {
        margin-top: $space-lg;
      }
    }

    .remove-btn {
      display: flow;
      cursor: pointer;
      margin: $space-sm;
      position: absolute;
      right: .5rem;
      top: .5rem;
      padding-top: $space;
        &:hover {
          color: $purple;
        }
    }

    .aph-input {
      border-color: $dark;
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

