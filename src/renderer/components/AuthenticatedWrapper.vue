<template>
  <section id="authenticated-wrapper">
    <sidebar></sidebar>
    <div class="content">
      <portfolio-header></portfolio-header>
      <router-view></router-view>
    </div>
    <div class="wallet-out-of-date" v-if="outOfDate">
      <div class="body">
        Your wallet is out of date. Please restart to automatically download <strong>v{{latestWalletVersion}}</strong>.
        <div class="btn-circle" @click="closeVersionWarning">
          <aph-icon name="show"></aph-icon>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import PortfolioHeader from './PortfolioHeader';
import Sidebar from './Sidebar';

const pjson = require('../../../package.json');
let fetchLatestWalletVersionIntervalId;
export default {
  components: {
    PortfolioHeader,
    Sidebar,
  },

  data() {
    return {
      outOfDate: false,
      latestWalletVersion: '',
    };
  },

  methods: {
    checkWalletVersion() {
      this.$store.dispatch('fetchLatestWalletVersion', {
        done: (v) => {
          this.outOfDate = v.version !== pjson.version;
          this.latestWalletVersion = v.version;
        },
      });
    },
    closeVersionWarning() {
      this.outOfDate = false;
    },
  },

  mounted() {
    this.$services.neo.fetchNEP5Tokens();

    if (!this.$services.wallets.getCurrentWallet()) {
      this.$router.push('/login');
    }

    fetchLatestWalletVersionIntervalId = setInterval(() => {
      this.checkWalletVersion();
    }, this.$constants.intervals.WALLETVERSIONCHECK);

    this.checkWalletVersion();
  },

  beforeDestroy() {
    clearInterval(fetchLatestWalletVersionIntervalId);
  },
};
</script>

<style lang="scss">
#authenticated-wrapper {
  display: flex;
  flex-direction: row;
  overflow: hidden;

  #sidebar {
    flex: none;
    width: $left-sidebar-width;
  }

  .content {
    background: $light-grey;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  
  .wallet-out-of-date {
    position: absolute;
    bottom: 0px;
    width: 50%;
    transform: translate(50%, 0);
    text-align: center;
    line-height: 1.5rem;    
    
    .body {
      padding: $space toRem(60px) $space-lg $space;
      border: 2px solid $purple;
      border-bottom: 0px;
      max-width: toRem(600px);
      background-color: white;
      display: block;
      margin: 0px auto;
      position: relative;

      .btn-circle {
        @extend %btn-circle;

        display: inline-flex;
        height: 1.5rem;
        width: 1.5rem;
  
        position: absolute;
        right: 5px;
        top: 5px;
        transform: rotate(45deg);
        
        .aph-icon {
          height: 1rem;
        }
      }
    }
  }
}
</style>

