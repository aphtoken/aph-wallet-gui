<template>
  <section id="authenticated-wrapper">
    <sidebar></sidebar>
    <div class="content">
      <portfolio-header v-if="$store.state.showPortfolioHeader"></portfolio-header>
      <router-view></router-view>
      <aph-claim-gas-modal v-if="$store.state.showClaimGasModal"></aph-claim-gas-modal>
      <aph-send-with-ledger-modal v-if="$store.state.showSendWithLedgerModal"></aph-send-with-ledger-modal>
    </div>
  </section>
</template>

<script>
import AphClaimGasModal from './modals/ClaimGasModal';
import AphSendWithLedgerModal from './modals/SendWithLedgerModal';
import PortfolioHeader from './PortfolioHeader';
import Sidebar from './Sidebar';

export default {
  components: {
    AphClaimGasModal,
    AphSendWithLedgerModal,
    PortfolioHeader,
    Sidebar,
  },

  data() {
    return {
      latestWalletVersion: '',
      outOfDate: false,
    };
  },

  mounted() {
    this.$services.neo.fetchNEP5Tokens();
  },
};
</script>

<style lang="scss">
#authenticated-wrapper {
  display: flex;
  flex-direction: row;
  overflow: hidden;

  > #sidebar {
    flex: none;
    width: $left-sidebar-width;
  }

  > .content {
    background: $background;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
}
</style>

