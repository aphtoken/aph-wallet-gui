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
      <a class="logout" to="" @click.prevent="logout">
        <span class="icon">
          <aph-icon name="back"></aph-icon>
        </span>
        <span class="label">Log Out</span>
      </a>
    </div>
    <div class="footer link-list">
      <div class="network-status">
        <div class="block">
          <span class="network">{{ $store.state.currentNetwork.net }} block</span><span class="index">{{ $store.state.currentNetwork.bestBlock.index }}</span>
        </div>
        <div class="last-update">
          <div v-if="showNetworkError" class="network-error">Unable to Reach Network</div>
          <div v-else>
            <aph-timestamp-from-now :timestamp="$store.state.lastReceivedBlock"></aph-timestamp-from-now>
          </div>
        </div>
      </div>
      <div class="version-number">{{ $store.state.version }}</div>
    </div>
  </section>
</template>

<script>
const SECONDS_BEFORE_NETWORK_ERROR = 120;

export default {
  computed: {
    showNetworkError() {
      if (!this.$store.state.lastReceivedBlock || !this.$store.state.lastSuccessfulRequest) {
        return false;
      }

      const blockSecondsAgo = moment.utc()
        .diff(moment(this.$store.state.lastReceivedBlock), 'seconds');
      const apiSuccessfulRequestSecondsAgo = moment
        .utc().diff(moment(this.$store.state.lastSuccessfulRequest), 'seconds');

      return blockSecondsAgo > SECONDS_BEFORE_NETWORK_ERROR
        && apiSuccessfulRequestSecondsAgo > SECONDS_BEFORE_NETWORK_ERROR;
    },
  },

  methods: {
    logout() {
      this.$services.wallets.clearCurrentWallet();
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
      align-items: center;
      border-left: 3px solid transparent;
      color: white;
      cursor: pointer;
      display: flex;
      font-size: toRem(16px);
      padding: $space-sm 0;
      transition: $transition;
      height: toRem(70px);

      .icon {
        flex: 1;
        text-align: center;

        svg {
          &.dashboard {
            height: toRem(42px);
          }

          &.back {
            height: toRem(20px);
          }

          &.wallet {
            height: toRem(35px);
          }

          &.history {
            height: toRem(42px);
          }

          &.settings {
            height: toRem(42px);
          }
        }

        .fill, .stroke {
          transition: $transition;
        }
      }

      .label {
        flex: 1.75;
      }

      &:hover, &.router-link-active {
        border-color: white;

        .icon {
          .stroke {
            stroke: white;
          }
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

  .footer {
    color: white;
    flex: none;
    font-family: GilroyMedium;
    font-size: toRem(12px);
    padding-bottom: $space;
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
        margin: $space-lg 0;
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


