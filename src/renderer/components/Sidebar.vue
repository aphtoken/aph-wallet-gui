<template>
  <section id="sidebar">
    <div class="header">
      <aph-icon name="logo-mark"></aph-icon>
    </div>
    <div class="menu link-list">
      <router-link to="/authenticated/dashboard">
        <span class="icon">
          <aph-icon name="dashboard"></aph-icon>
        </span>
        <span class="label">Dashboard</span>
      </router-link>
      <router-link to="/authenticated/assets">
        <span class="icon">
          <aph-icon name="wallet"></aph-icon>
        </span>
        <span class="label">Assets</span>
      </router-link>
      <router-link to="/authenticated/history">
        <span class="icon">
          <aph-icon name="history"></aph-icon>
        </span>
        <span class="label">History</span>
      </router-link>
      <router-link to="/authenticated/settings">
        <span class="icon">
          <aph-icon name="settings"></aph-icon>
        </span>
        <span class="label">Settings</span>
      </router-link>
    </div>
    <div class="logout-wrapper" @click.prevent="logout">
      <aph-icon name="logout"></aph-icon>
    </div>
    <div class="footer link-list">
      <div class="network-status">
        <div class="block">
          <span class="network">{{ currentNetwork.net }} block</span><span class="index">{{ currentNetwork.bestBlock.index }}</span>
        </div>
        <div class="last-update">
          <div v-if="showNetworkError" class="network-error">Unable to Reach Network</div>
          <div v-else>
            <aph-timestamp-from-now :timestamp="lastReceivedBlock"></aph-timestamp-from-now>
          </div>
        </div>
      </div>
      <div class="version-number">{{ version }}</div>
    </div>
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
    ]),
  },

  methods: {
    logout() {
      this.$services.wallets.clearCurrentWallet();
      this.$store.commit('handleLogout');
      this.$router.push('/login');
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

  .header {
    flex: none;
    padding: $space-xl;

    .logo-mark {
      .fill {
        fill: white;
      }
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
      padding: $space-sm 0;
      height: toRem(70px);

      .icon {
        flex: 1;
        text-align: center;

        svg {
          &.dashboard {
            height: toRem(42px);
          }

          &.wallet {
            height: toRem(35px);
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
}
</style>


