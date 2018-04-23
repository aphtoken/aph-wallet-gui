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
      <div class="network-status" v-if="network">
        <div class="block">
          <span class="network">{{network.net}} block</span><span class="index">{{blockIndex}}</span>
        </div>
        <div class="last-update">
          <div v-if="showNetworkError" class="network-error">Unable to Reach Network</div>
          <div v-else>
            <aph-timestamp-from-now :timestamp="network.lastSuccessfulRequest"></aph-timestamp-from-now>
          </div>
        </div>
      </div>
      <div class="version-number">{{$store.state.version}}</div>
    </div>
  </section>
</template>

<script>
let loadNetworkStatusIntervalId;

export default {
  beforeDestroy() {
    clearInterval(loadNetworkStatusIntervalId);
  },

  beforeMount() {
    this.loadStatus();

    loadNetworkStatusIntervalId = setInterval(() => {
      this.loadStatus();
    }, 1000);
  },

  methods: {
    logout() {
      this.$services.wallets.clearCurrentWallet();
      this.$router.push('/login');
    },

    loadStatus() {
      this.network = this.$services.network.getSelectedNetwork();

      if (this.network.bestBlock) {
        this.blockIndex = this.network.bestBlock.index;
        this.blockSecondsAgo = moment.utc().diff(moment.utc(this.network.lastReceivedBlock), 'seconds');
        const apiSuccessfulRequestSecondsAgo =
          moment.utc().diff(moment.utc(this.network.lastSuccessfulRequest), 'seconds');
        this.showNetworkError = this.blockSecondsAgo > 120 && apiSuccessfulRequestSecondsAgo > 120;
      }
    },
  },

  data() {
    return {
      network: null,
      blockIndex: 0,
      blockSecondsAgo: 0,
      showNetworkError: false,
    };
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


