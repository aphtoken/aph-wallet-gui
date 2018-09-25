<template>
  <section id="authenticated-wrapper" :class="[$store.state.styleMode, {'show-transactions-sidebar': showTransactionsSidebar}]">
    <sidebar></sidebar>
    <div @click="menuToggleable && !menuCollapsed ? $store.commit('setMenuCollapsed', true) : null" :class="{'filler': menuToggleable && !menuCollapsed}" class="content">
      <portfolio-header v-if="$store.state.showPortfolioHeader"></portfolio-header>
      <router-view></router-view>
      <aph-claim-gas-modal v-if="$store.state.showClaimGasModal"></aph-claim-gas-modal>
      <aph-send-with-ledger-modal v-if="$store.state.showSendWithLedgerModal"></aph-send-with-ledger-modal>
      <aph-fracture-gas-modal v-if="$store.state.fractureGasModalModel" :onClose="hideFractureGasModal"></aph-fracture-gas-modal>
    </div>
    <transactions-sidebar v-if="showTransactionsSidebar"></transactions-sidebar>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';

import AphClaimGasModal from './modals/ClaimGasModal';
import AphFractureGasModal from './modals/FractureGasModal';
import AphSendWithLedgerModal from './modals/SendWithLedgerModal';
import PortfolioHeader from './PortfolioHeader';
import Sidebar from './Sidebar';
import TransactionsSidebar from './TransactionsSidebar';

let loadTokensIntervalId;
let loadHoldingsIntervalId;

export default {
  beforeDestroy() {
    clearInterval(loadTokensIntervalId);
    clearInterval(loadHoldingsIntervalId);
  },

  mounted() {
    this.$services.neo.fetchNEP5Tokens(() => {
      // Fetch user assets more quickly on initial mount
      this.$store.dispatch('fetchHoldings');
      // Fetch any other assets that have been added to the wallet
      this.loadHoldings();
    });

    loadTokensIntervalId = setInterval(() => {
      this.$services.neo.fetchNEP5Tokens();
    }, this.$constants.intervals.TOKENS_POLLING);

    loadHoldingsIntervalId = setInterval(() => {
      this.loadHoldings();
    }, this.$constants.intervals.HOLDINGS_POLLING);
  },

  methods: {
    loadHoldings() {
      this.$store.dispatch('fetchHoldings');
    },

    hideFractureGasModal() {
      this.$store.commit('setFractureGasModalModel', null);
    },
  },

  components: {
    AphClaimGasModal,
    AphSendWithLedgerModal,
    AphFractureGasModal,
    PortfolioHeader,
    Sidebar,
    TransactionsSidebar,
  },

  data() {
    return {
      latestWalletVersion: '',
      outOfDate: false,
      showTransactionsSidebar: false,
    };
  },

  computed: {
    ...mapGetters([
      'menuCollapsed',
      'menuToggleable',
    ]),
  },

  watch: {
    $route(to) {
      this.showTransactionsSidebar = to.matched.some(record => record.meta.showTransactionsSidebar);
    },
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

  > #transactions-sidebar {
    flex: none;
  }

  &.show-transactions-sidebar {
    > .content {
      margin-right: $right-sidebar-width-collapsed;
    }
  }
}
</style>

