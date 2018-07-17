<template>
  <section id="settings--wallet-actions" v-if="canBackupWallet">
    <div class="body">
      <button class="backup-wallet" @click="showWalletBackupModal">{{$t('backupWallet')}}</button>
    </div>
  </section>
</template>

<script>
export default {
  computed: {
    canBackupWallet() {
      return this.$store.state.currentWallet && this.$store.state.currentWallet.isLedger !== true;
    },
  },

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
  margin-bottom: $space-lg;

  .backup-wallet {
    @extend %btn;

    &:hover {
      box-shadow: $box-shadow-sm;
    }
  }
}
</style>
