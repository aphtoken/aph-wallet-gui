<template>
  <section id="login--menu">
    <router-link class="saved-wallet-btn" to="/login/saved-wallet">
      Saved wallet
    </router-link>
    <router-link class="private-key-btn" to="/login/ledger" v-if="ledgerSupported">
      Ledger
    </router-link>
    <router-link class="encrypted-key-btn" to="/login/encrypted-key">
      Encrypted key
    </router-link>
    <router-link class="private-key-btn" to="/login/private-key">
      Private key
    </router-link>
  </section>
</template>

<script>
export default {
  computed: {
    ledgerSupported() {
      return process.platform !== 'darwin';
    },
  },

  mounted() {
    this.$store.commit('resetRequests');
  },
};
</script>

<style lang="scss">
#login--menu {
  max-width: toRem(400px);
  width: 60%;

  a {
    color: white;
    display: block;

    & + a {
      margin-top: $space-xl;
    }
  }

  .saved-wallet-btn, .encrypted-key-btn, .private-key-btn {
    @extend %btn-outline;
  }
}
</style>


