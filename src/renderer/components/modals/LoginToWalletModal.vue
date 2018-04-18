<template>
  <modal-wrapper id="aph-login-to-wallet-modal" identifier="openSavedWallet">
    <template v-if="showRemove">
      <div class="header">
        <aph-icon name="wallet"></aph-icon>
      </div>
      <div class="body">
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
        <div class="name">{{$store.state.currentLoginToWallet.label}}</div>
        <div class="options" @click="toggleOptions" title="Show Wallet Options">
          Options
          <aph-icon name="send" v-if="showWalletOptions"></aph-icon>
          <aph-icon name="receive" v-else></aph-icon>
        </div>
      </div>
      <div v-if="!showWalletOptions">
        <div v-if="isNotCurrentWallet" class="body">
          <aph-input :placeholder="loginMessage" :light="true" v-model="passphrase" type="password"></aph-input>
        </div>
        <div v-else class="body">
          <aph-icon name="wallet"></aph-icon>
        </div>
      </div>
      <div v-else class="body">
        <div class="backup-btn" @click="backup">Backup Wallet Keys</div>
        <div class="remove-btn" @click="showRemoveConfirmation">Delete This Wallet</div>
      </div>
      <div class="footer">
        <div class="cancel-btn" @click="onCancel">Cancel</div>
        <button v-if="isNotCurrentWallet && !showWalletOptions" class="login-btn" @click="login" :disabled="shouldDisableLoginButton">
          {{ buttonLabel }}
        </button>
      </div>
    </template>
  </modal-wrapper>
</template>

<script>
import ModalWrapper from './ModalWrapper';

export default {
  data() {
    return {
      passphrase: '',
      showRemove: false,
      confirmWalletName: '',
      showWalletOptions: false,
      backingUp: false,
    };
  },

  components: {
    ModalWrapper,
  },

  computed: {
    loginMessage() {
      return this.backingUp === false ? 'Enter your passphrase to login'
        : 'Enter your passphrase to decrypt your wallet';
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
          if (this.backingUp === true) {
            this.$store.commit('setWalletBackup', this.$store.state.currentWallet);
            this.$router.push({ path: '/authenticated/settings/wallet-backup' });
          }

          this.onCancel();
        },
      });
    },

    toggleOptions() {
      this.showWalletOptions = !this.showWalletOptions;
    },

    backup() {
      if (this.isNotCurrentWallet) {
        this.backingUp = true;
        this.showWalletOptions = false;
      } else {
        this.$store.commit('setWalletBackup', this.$store.state.currentWallet);
        this.$router.push({ path: '/authenticated/settings/wallet-backup' });
        this.onCancel();
      }
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
  .content {
    width: 35rem;
  }
  .header {
    display: flex;
    justify-content: center;

    .name {
      flex: 1;
      font-family: GilroyMedium;
      font-size: toRem(18px);
    }

    .aph-icon {
      svg {
        height: $space-xl;
      }

      .fill {
        fill: $dark;
      }
    }

    .options {
      color: $grey;
      cursor: pointer;
      flex: none;
      font-family: GilroySemibold;
      font-size: 1rem;
      transition: $transition;
      padding-right: 3 * $space;
      padding-top: $space;
      margin-top: -1 * $space;
      height: 2 * $space;      
      position: relative;
    
      &:hover {
        color: $purple;
      }
      
      .aph-icon {
        top: 5px;
        position: absolute;
        right: 0px;
        height: 2 * $space;     
        
        svg {
          height: $space * 2;
        }

        .fill {
          fill: $grey;
        }
      }
    }
  }

  .body {
    padding: $space-lg;
    text-align: center;
    display: block;
    position: relative;

    p {
      margin-bottom: $space-lg;
      line-height: $line-height;

      &:first-child {
        span {
          font-family: GilroySemibold;
        }
      }
    }

    .aph-icon {
      margin-bottom: $space-lg;

      svg {
        height: $space-xl;
      }
    }

    .warning {
      color: $red;
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
    
    

    .backup-btn {
      @extend %btn-footer-light;

      border-bottom-left-radius: $border-radius;
      margin-bottom: $space;
    }
    .remove-btn {
      @extend %btn-footer-light;

      border-bottom-left-radius: $border-radius;
      color: $red;
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

