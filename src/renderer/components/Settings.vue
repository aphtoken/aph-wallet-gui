<template>
  <section id="settings">
    <div class="grid">
      <div class="grid--column left">
        <router-view name="top-left"></router-view>
        <router-view name="bottom-left"></router-view>
      </div>
      <div class="grid--column right">
        <router-view name="top-right"></router-view>
        <router-view name="bottom-right"></router-view>
      </div>
    </div>
    <wallet-backup-modal v-if="$store.state.showWalletBackupModal" :onDone="hideWalletBackupModal"></wallet-backup-modal>
  </section>
</template>
<script>
import WalletBackupModal from './modals/WalletBackupModal';

export default {
  components: {
    WalletBackupModal,
  },

  methods: {
    hideWalletBackupModal() {
      this.$store.commit('setShowWalletBackupModal', false);
    },
  },
};
</script>

<style lang="scss">
#settings {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: $space-lg;

  .grid {
    display: flex;
    flex-direction: row;
    flex: 1;
  }

  .grid--column {
    display: flex;
    flex-direction: column;
    flex: 1;

    &.right {
      margin-left: $space-lg;
    }
  }

  #settings--wallet-actions {
    flex: none;
  }

  #settings--address-book {
    flex: 1;
  }
}
</style>

