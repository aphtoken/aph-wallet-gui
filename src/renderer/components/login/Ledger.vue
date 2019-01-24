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
    async checkLedgerStatus() {
      if (this.connected || this.verifying) {
        return;
      }

      try {
        this.verifying = true;
        await new Promise(async (resolve, reject) => {
          this.$store.dispatch('verifyLedgerConnection', {
            done: async () => {
              this.connected = true;
              await this.login();
              resolve();
            },
            failed: () => reject(),
          });
        });
      } catch (e) {
        this.connected = false;
      }
      this.verifying = false;
    },

    async login() {
      if (!this.connected) {
        return;
      }

      await this.$store.dispatch('openLedger', {
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

