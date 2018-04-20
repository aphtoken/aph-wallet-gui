<template>
  <section id="settings--wallet-actions">
    <div class="body">
      <button class="backup-wallet" @click="showWalletBackupModal">Backup Wallet</button>
    </div>
  </section>
</template>

<script>
export default {
  methods: {
    showWalletBackupModal() {
      this.$store.commit('setShowWalletBackupModal', true);
    },
  },
};
</script>


<style lang="scss">
#settings--wallet-actions {
  @extend %tile-light;

  padding: $space-lg;

  .backup-wallet {
    @extend %btn;
  }
}
</style>
