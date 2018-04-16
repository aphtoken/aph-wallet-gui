<template>
  <section id="login--ledger">
    <login-form-wrapper identifier="verifyLedgerConnection">
      <button class="login" @click="login" v-if="connected" :disabled="shouldDisableLoginButton">{{ buttonLabel }}</button>
    </login-form-wrapper>
  </section>
</template>

<script>
import LoginFormWrapper from './LoginFormWrapper';

const ledgerPollingInterval = 1000;
let checkLedgerStatusIntervalId;
export default {
  components: {
    LoginFormWrapper,
  },

  beforeDestroy() {
    clearInterval(checkLedgerStatusIntervalId);
  },

  beforeMount() {
    this.checkLedgerStatus();
    checkLedgerStatusIntervalId = setInterval(() => {
      this.checkLedgerStatus();
    }, ledgerPollingInterval);
  },

  computed: {
    buttonLabel() {
      return this.$isPending('openLedger') ? 'Logging in...' : 'Login with Ledger';
    },
    shouldDisableLoginButton() {
      return this.$isPending('openLedger');
    },
  },

  data() {
    return {
      connected: null,
    };
  },

  methods: {
    checkLedgerStatus() {
      this.$store.dispatch('verifyLedgerConnection', {
        done: () => {
          this.connected = true;
        },
        failed: () => {
          this.connected = false;
        },
      });
    },
    login() {
      if (!this.connected) {
        return;
      }
      this.$store.dispatch('openLedger', {
        done: () => {
          this.$router.push('/authenticated/dashboard');
        },
        failed: () => {
          this.connected = false;
        },
      });
    },
  },
};
</script>

<style lang="scss">
#login--ledger {
  max-width: toRem(400px);
  width: 60%;

  .aph-input {
    margin-top: $space-lg;
  }

  .login {
    @extend %btn-outline;

    margin-top: $space-lg;
  }
}
</style>

