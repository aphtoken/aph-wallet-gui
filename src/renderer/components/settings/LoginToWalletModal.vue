<template>
  <div id="aph-login-to-wallet-modal">
    <div class="content">
      <div class="body">
        <aph-input placeholder="Enter your passphrase here" :light="true" v-model="passphrase" type="password"></aph-input>
      </div>
      <div class="footer">
        <div class="cancel-btn" @click="onCancel">Cancel</div>
        <button class="login-btn" @click="login" :disabled="shouldDisableLoginButton">{{ buttonLabel }}</button>
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
    };
  },

  computed: {
    buttonLabel() {
      return this.$isPending('openSavedWallet') ? 'Logging in...' : 'Login';
    },

    shouldDisableLoginButton() {
      return this.$isPending('openSavedWallet') || this.passphrase.length === 0;
    },
  },

  methods: {
    login() {
      if (this.$isPending('openSavedWallet')) {
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
    width: toRem(400px);
  }

  .body {
    padding: $space-lg;
    text-align: center;

    .aph-icon {
      margin-bottom: $space-lg;

      svg {
        height: $space-xl;
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

