<template>
  <section id="login--ledger">
    <login-form-wrapper identifier="openLedger">
      <aph-input :hasError="$isFailed('openLedger')" v-model="wif" placeholder="Enter your private key here (WIF)" type="password"></aph-input>
      <button class="login" @click="login" :disabled="shouldDisableLoginButton">Login</button>
    </login-form-wrapper>
  </section>
</template>

<script>
import LoginFormWrapper from './LoginFormWrapper';

const ledgerPollingInterval = 10000;
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
    shouldDisableLoginButton() {
      return this.wif.length === 0;
    },
  },

  data() {
    return {
      wif: '',
    };
  },

  methods: {
    checkLedgerStatus() {
      this.$services.ledger.open();
    },
    login() {
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


