<template>
  <div id="login--menu">
    <router-link class="saved-wallet-btn" to="/login/saved-wallet">
      Saved wallet
    </router-link>
    <router-link class="encrypted-key-btn" to="/login/encrypted-key">
      Encrypted key
    </router-link>
    <router-link class="private-key-btn" to="/login/private-key">
      Private key
    </router-link>
  </div>
</template>

<script>
export default {
  //
};
</script>

<style lang="scss">
#login--menu {
  width: 20rem;

  a {
    color: white;
    display: block;

    & + a {
      margin-top: $space-lg;
    }
  }

  .saved-wallet-btn, .encrypted-key-btn, .private-key-btn {
    @extend %btn-outline;
  }
}
</style>


