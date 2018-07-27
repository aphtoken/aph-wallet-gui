<template>
  <section id="authenticated-wrapper" :class="[$store.state.styleMode]">
    <sidebar></sidebar>
    <div @click="menuToggleable && !menuCollapsed ? $store.commit('setMenuCollapsed', true) : null" :class="{'filler': menuToggleable && !menuCollapsed}" class="content">
      <portfolio-header v-if="$store.state.showPortfolioHeader"></portfolio-header>
      <router-view></router-view>
      <aph-claim-gas-modal v-if="$store.state.showClaimGasModal"></aph-claim-gas-modal>
      <aph-send-with-ledger-modal v-if="$store.state.showSendWithLedgerModal"></aph-send-with-ledger-modal>
    </div>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';
import PortfolioHeader from './PortfolioHeader';
import Sidebar from './Sidebar';
import AphSendWithLedgerModal from './modals/SendWithLedgerModal';
import AphClaimGasModal from './modals/ClaimGasModal';

let loadTokensIntervalId;

export default {
  beforeDestroy() {
    clearInterval(loadTokensIntervalId);
  },

  mounted() {
    this.$services.neo.fetchNEP5Tokens();

    loadTokensIntervalId = setInterval(() => {
      this.$services.neo.fetchNEP5Tokens();
    }, this.$constants.intervals.TOKENS_POLLING);
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

  computed: {
    ...mapGetters([
      'menuCollapsed',
      'menuToggleable',
    ]),
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

    @include lowRes() {
      width: $left-sidebar-width-lowres;
    }
  }

  > .content {
    background: $background;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
}
</style>

