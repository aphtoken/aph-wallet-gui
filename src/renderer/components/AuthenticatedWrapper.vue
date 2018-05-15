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
import PortfolioHeader from './PortfolioHeader';
import Sidebar from './Sidebar';
import AphSendWithLedgerModal from './modals/SendWithLedgerModal';
import AphClaimGasModal from './modals/ClaimGasModal';

let fetchAllIntervalId;

export default {
  beforeUnmount() {
    clearInterval(fetchAllIntervalId);
  },

  components: {
    PortfolioHeader,
    Sidebar,
    AphSendWithLedgerModal,
    AphClaimGasModal,
  },

  data() {
    return {
      outOfDate: false,
      latestWalletVersion: '',
    };
  },

  mounted() {
    this.$services.neo.fetchNEP5Tokens();

    this.$store.dispatch('fetchAll');
    fetchAllIntervalId = setInterval(() => {
      this.$store.dispatch('fetchAll');
    }, this.$constants.intervals.POLLING);
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

