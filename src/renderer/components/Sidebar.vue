<template>
  <section id="sidebar" @click="collapsed ? setCollapsed(!collapsed) : null" 
    :class="{'collapsed': toggleable && collapsed, 'expanded': toggleable && !collapsed}">
    <aph-icon class="toggle" 
      v-if="toggleable"
      @click.stop.prevent="setCollapsed(!collapsed)" 
      :name="collapsed ? 'double-arrow-right' : 'double-arrow-left'">
    </aph-icon>
    <template v-if="!toggleable || (toggleable && !collapsed)">
      <div class="header">
        <aph-icon name="logo-mark"></aph-icon>
      </div>
      <div class="menu link-list">
        <router-link :to="sendInProgress ? '/authenticated/dashboard/confirming': '/authenticated/dashboard'">
          <span class="icon">
            <aph-icon name="dashboard"></aph-icon>
          </span>
          <span class="label">{{ $t('dashboard') }}</span>
        </router-link>
        <router-link v-if="currentNetwork.net !== 'MainNet'" to="/authenticated/dex">
          <span class="icon">
            <aph-icon name="dex"></aph-icon>
          </span>
          <span class="label">{{ $t('tradeDEX') }}</span>
        </router-link>
        <router-link v-else to="/authenticated/buy-aph">
          <span class="icon">
            <aph-icon name="dex"></aph-icon>
          </span>
          <span class="label">{{ $t('buyAph') }}</span>
        </router-link>
        <router-link to="/authenticated/assets">
          <span class="icon">
            <aph-icon name="wallet"></aph-icon>
          </span>
          <span class="label">{{ $t('assets') }}</span>
        </router-link>
        <router-link to="/authenticated/history">
          <span class="icon">
            <aph-icon name="history"></aph-icon>
          </span>
          <span class="label">{{ $t('history') }}</span>
        </router-link>
        <router-link to="/authenticated/token-sale">
          <span class="icon">
            <aph-icon name="ico"></aph-icon>
          </span>
          <span class="label">{{ $t('joinIco') }}</span>
        </router-link>
        <router-link to="/authenticated/settings">
          <span class="icon">
            <aph-icon name="settings"></aph-icon>
          </span>
          <span class="label">{{ $t('settings') }}</span>
        </router-link>
      </div>
      <div class="logout-wrapper" @click.prevent="logout">
        <aph-icon name="logout"></aph-icon>
      </div>
      <div class="footer link-list">
        <div class="network-status">
          <div class="block">
            <span class="network">{{ currentNetwork ? currentNetwork.net : 0 }} {{$t('block')}}</span>
            <span class="index">{{ currentNetwork && currentNetwork.bestBlock ? currentNetwork.bestBlock.index : 0}}</span>
          </div>
          <div class="last-update">
            <div v-if="showNetworkError" class="network-error">{{$t('unableToReachNetwork')}}</div>
            <div v-else>
              <aph-timestamp-from-now :timestamp="lastReceivedBlock"></aph-timestamp-from-now>
            </div>
          </div>
        </div>
        <div class="version-number">{{ version }}</div>
      </div>
    </template>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';

const SECONDS_BEFORE_NETWORK_ERROR = 120;

export default {
  computed: {
    showNetworkError() {
      if (!this.$store.state.lastReceivedBlock || !this.$store.state.lastSuccessfulRequest) {
        return false;
      }

      const blockSecondsAgo = moment.utc()
        .diff(moment.unix(this.$store.state.lastReceivedBlock), 'seconds');
      const apiSuccessfulRequestSecondsAgo = moment
        .utc().diff(moment.unix(this.$store.state.lastSuccessfulRequest), 'seconds');

      return blockSecondsAgo > SECONDS_BEFORE_NETWORK_ERROR
        && apiSuccessfulRequestSecondsAgo > SECONDS_BEFORE_NETWORK_ERROR;
    },

    ...mapGetters([
      'currentNetwork',
      'lastReceivedBlock',
      'version',
      'sendInProgress',
    ]),

    ...mapGetters({
      toggleable: 'menuToggleable',
      collapsed: 'menuCollapsed',
    }),
  },

  methods: {
    logout() {
      this.$services.wallets.clearCurrentWallet();
      this.$store.commit('handleLogout');
      this.$router.push('/login');
    },
    setCollapsed(collapsed) {
      this.$store.commit('setMenuCollapsed', collapsed);
    },
  },
  watch: {
    $route(to) {
      const isToggleable = to.matched.some(record => record.meta.isMenuToggleable);
      this.$store.commit('setMenuToggleable', isToggleable);

      if (isToggleable) {
        this.setCollapsed(true);
      }
    },
  },
};
</script>

<style lang="scss">
#sidebar {
  background: $purple;
  display: flex;
  flex-direction: column;
  overflow: auto;
  position: relative;

  .header {
    flex: none;
    padding: $space-xl;

    .logo-mark {
      .fill {
        fill: white;
      }
    }

    @include lowRes() {
      padding-bottom: $space-lg;
    }
  }

  .link-list {
    margin: 0;
    padding: 0;

    a {
      @include transition(border-color);

      align-items: center;
      border-left: $border-width-thick solid transparent;
      color: white;
      cursor: pointer;
      display: flex;
      font-size: toRem(17px);
      height: toRem(58px);

      .icon {
        flex: 1;
        text-align: center;

        svg {
          &.dashboard {
            height: toRem(42px);
          }

          &.dex {
            height: toRem(42px);
          }

          &.wallet {
            height: toRem(35px);
          }

          &.ico {
            height: toRem(42px);
          }

          &.history {
            height: toRem(42px);
          }

          &.settings {
            height: toRem(35px);
          }
        }
      }

      .label {
        flex: 1.75;
      }

      &:hover, &.router-link-active {
        border-color: white;

        .icon {
          .fill {
            fill: white;
          }
        }
      }

      & + a {
        margin-top: $space;
      }

      @include lowRes() {
        height: toRem(50px);
      }
    }
  }
  .menu {
    flex: 1;
  }

  .logout-wrapper {
    cursor: pointer;
    display: flex;
    flex: none;
    justify-content: center;
    margin-bottom: $space-lg;

    svg {
      height: toRem(35px);
    }

    .fill {
      fill: white;
    }
  }

  .footer {
    background: $purple-hover;
    color: white;
    flex: none;
    font-family: GilroyMedium;
    font-size: toRem(12px);
    padding: $space-lg 0;
    text-transform: uppercase;
    text-align: center;

    .network-status {
      .block {
        align-items: center;
        display: flex;
        justify-content: center;

        .network {
          color: $dark;
          font-family: GilroySemibold;
        }

        .index {
          margin-left: $space;
        }
      }

      .last-update {
        margin: $space 0;
      }
    }

    .network-error {
      color: $red;
      font-family: GilroySemibold;
    }

    .version-number {
      &:before {
        content: "V";
        color: $dark;
        font-family: GilroySemibold;
      }
    }
  }

  &.collapsed {
    cursor: pointer;
    width: $left-sidebar-width-collapsed !important;

    &:hover {
      background-color: $purple-hover;
    }
  }

  &.expanded {
    position: absolute;
    top: 0px;
    left: 0px;
    height: 100%;
    z-index: 10000;
  }

  .toggle {
    position: absolute;
    right: toRem($space);
    top: 50%;
    cursor: pointer;

    svg {
      width: toRem(20px);
      height: toRem(20px);
    }

    .fill {
      fill: #FFF;
    }
  }
}

#authenticated-wrapper .content {
  &.filler {
    margin-left: $left-sidebar-width-collapsed;
  }
}
</style>


