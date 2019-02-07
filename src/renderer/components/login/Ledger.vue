<template>
  <section id="login--ledger">
    <login-form-wrapper identifier="verifyLedgerConnection">
      <button class="login" @click="login" v-if="connected" :disabled="shouldDisableLoginButton">{{ buttonLabel }}</button>
    </login-form-wrapper>
    <div class="aph-request-status-message" v-if="connected === null">
      <aph-icon name="unconfirmed-big"></aph-icon>
      <div class="right">{{$t('noLedgerDeviceFound')}}</div>
    </div>
  </section>
</template>

<script>
import LoginFormWrapper from './LoginFormWrapper';

const ledgerPollingInterval = 1000;
let checkLedgerStatusIntervalId;
export default {
  beforeDestroy() {
    clearInterval(checkLedgerStatusIntervalId);
  },

  beforeMount() {
    checkLedgerStatusIntervalId = setInterval(() => {
      this.checkLedgerStatus();
    }, ledgerPollingInterval);
  },

  components: {
    LoginFormWrapper,
  },

  computed: {
    buttonLabel() {
      return this.$isPending('openLedger') ? this.$t('loggingIn') : this.$t('loginWithLedger');
    },

    shouldDisableLoginButton() {
      return this.$isPending('openLedger');
    },
  },

  data() {
    return {
      connected: null,
      verifying: null,
    };
  },

  methods: {
    checkLedgerStatus() {
      if (this.connected === true || this.verifying) {
        return;
      }

      this.verifying = true;
      this.$store.dispatch('verifyLedgerConnection', {
        done: () => {
          this.connected = true;
          this.login();
        },
        failed: () => {
          this.connected = false;
          this.verifying = false;
        },
      });
    },

    login() {
      if (!this.connected) {
        return;
      }

      this.$store.dispatch('openLedger', {
        done: () => {
          this.verifying = false;
          this.$router.push('/authenticated/dashboard');
        },
        failed: () => {
          this.connected = false;
          this.verifying = false;
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

