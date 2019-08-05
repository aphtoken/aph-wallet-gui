<template>
  <section id="login--menu">
    <router-link class="saved-wallet-btn" to="/login/saved-wallet">
      {{$t('savedWallet')}}
    </router-link>
    <router-link class="private-key-btn" to="/login/ledger">
      {{$t('ledger')}}
    </router-link>
    <router-link class="encrypted-key-btn" to="/login/encrypted-key">
      {{$t('encryptedKey')}}
    </router-link>
    <router-link class="private-key-btn" to="/login/private-key">
      <!-- {{$t('privateKey')}} -->
      WIF
    </router-link>
    <router-link class="private-key-seed-words-btn" to="/login/private-key-seed-words">
      WIF + Mnemonic Words
    </router-link>
  </section>
</template>

<script>
export default {
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

  .saved-wallet-btn, .encrypted-key-btn, .private-key-btn, .private-key-seed-words-btn {
    @extend %btn-outline;
  }
}
</style>


