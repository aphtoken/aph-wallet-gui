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
    <div class="footer link-list">
      <div class="network-status" v-if="network">
        {{network.net}} Block: {{blockIndex}}
        <div>
          <aph-timestamp-from-now :timestamp="network.lastReceivedBlock"></aph-timestamp-from-now>
        </div>
      </div>
      <div class="version-number">v{{$store.state.version}}</div>
      <a href="#" @click="logOut">
        <span class="icon">
          <aph-icon name="back"></aph-icon>
        </span>
        <span class="label">Log Out</span>
      </a>
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
    logOut() {
      this.$services.wallets.clearCurrentWallet();
      this.$router.push('/login');
    },

    loadStatus() {
      this.network = this.$services.network.getSelectedNetwork();

      if (this.network.bestBlock) {
        this.blockIndex = this.network.bestBlock.index;
      }
    },
  },

  data() {
    return {
      network: null,
      blockIndex: 0,
    };
  },
};
</script>

<style lang="scss">
#sidebar {
  background: $purple;
  display: flex;
  flex-direction: column;

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
      font-size: toRem(20px);
      padding: $space-sm 0;
      transition: $transition;

      .icon {
        flex: 1;
        text-align: center;

        svg {
          height: toRem(50px);
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
    flex: none;
    padding-bottom: $space;

    a {
      font-size: toRem(15px);

      &:hover {
        border-color: transparent;
      }

      .icon {
        svg {
          height: toRem(20px);
        }

        .fill {
          fill: white;
        }
      }
    }

    .network-status {
      color: #cccccc;
      font-size: smaller;
      line-height: 1.25rem;
      padding: $space-sm;
      text-align: center;
    }
    .version-number {
      color: white;
      font-size: smaller;
      padding: $space-xsm;
      text-align: center;
    }
  }
}
</style>


