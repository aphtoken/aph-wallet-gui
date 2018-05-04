<template>
  <modal-wrapper id="aph-login-to-wallet-modal" identifier="openSavedWallet">
    <template v-if="showRemove">
      <div class="body">
        <aph-icon name="wallet"></aph-icon>
        <div class="wallet-name">{{ $store.state.currentLoginToWallet.label }}</div>
        <p>Are you sure you'd like to remove <span>{{$store.state.currentLoginToWallet.label}}</span>?</p>
        <p><span class="warning">Loss of funds is possible</span>, if you have not properly backed up this wallet's keys.</p>
        <aph-input placeholder="Enter the name of your wallet to delete" :light="true" v-model="confirmWalletName"></aph-input>
      </div>
      <div class="footer">
        <div class="cancel-btn" @click="cancelRemove">Cancel</div>
        <button class="login-btn" @click="remove" :disabled="shouldDisableDeleteButton">Yes, Delete Wallet</button>
      </div>
    </template>
    <template v-else>
      <div class="header">
        <div class="remove" @click="showRemoveConfirmation">Remove</div>
      </div>
      <div class="body">
        <aph-icon name="wallet"></aph-icon>
        <div class="wallet-name">{{ $store.state.currentLoginToWallet.label }}</div>
        <aph-input v-if="isNotCurrentWallet" :placeholder="loginMessage" :light="true" v-model="passphrase" type="password"></aph-input>
      </div>
      <div class="footer">
        <div class="cancel-btn" @click="onCancel">Cancel</div>
        <button v-if="isNotCurrentWallet" class="login-btn" @click="login" :disabled="shouldDisableLoginButton">
          {{ buttonLabel }}
        </button>
      </div>
    </template>
  </modal-wrapper>
</template>

<script>
import ModalWrapper from './ModalWrapper';

export default {
  components: {
    ModalWrapper,
  },

  computed: {
    loginMessage() {
      return 'Enter your passphrase to login';
    },

    buttonLabel() {
      return this.$isPending('openSavedWallet') ? 'Logging in...' : 'Login';
    },

    isNotCurrentWallet() {
      return this.$store.state.currentWallet.label !== this.$store.state.currentLoginToWallet.label;
    },

    shouldDisableLoginButton() {
      return this.$isPending('openSavedWallet') || this.passphrase.length === 0;
    },

    shouldDisableDeleteButton() {
      return this.$isPending('deleteWallet')
        || this.confirmWalletName.toLowerCase()
          !== this.$store.state.currentLoginToWallet.label.toLowerCase();
    },
  },

  data() {
    return {
      confirmWalletName: '',
      passphrase: '',
      showRemove: false,
    };
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
          this.$store.dispatch('fetchPortfolio');
          this.onCancel();
        },
      });
    },

    showRemoveConfirmation() {
      this.$store.commit('endRequest', { identifier: 'openSavedWallet' });
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

  props: {
    onCancel: {
      required: true,
      type: Function,
    },
  },
};
</script>


<style lang="scss">
#aph-login-to-wallet-modal {
  .header {
    padding: $space-lg $space-lg 0;

    .remove {
      @include transition(color);

      color: $grey;
      cursor: pointer;
      font-family: GilroyMedium;
      font-size: toRem(10px);
      text-align: right;
      text-transform: uppercase;

      &:hover {
        color: $purple;
      }
    }
  }

  .body {
    padding: $space-xl $space-lg $space-lg;
    text-align: center;
    display: block;
    position: relative;

    .wallet-name {
      color: $purple;
      font-family: GilroyMedium;
      font-size: toRem(18px);
      padding: $space-lg 0;
    }

    p {
      margin-bottom: $space-lg;

      &:first-child {
        span {
          font-family: GilroySemibold;
        }
      }
    }

    .aph-icon {
      svg {
        height: toRem(44px);
      }

      & + p {
        margin-top: $space-xl;
      }
    }

    .warning {
      color: $red;
    }

    .aph-input {
      border-color: $grey;
      margin-top: $space-lg;
      width: 100%;

      &.focused {
        border-color: $purple;
      }

      input {
        color: $dark;
      }

      .aph-icon {
        margin-bottom: 0;

        svg {
          height: toRem(16px);

          &.eye-closed {
            height: toRem(17px);
          }
        }

        .fill {
          fill: $grey;
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

