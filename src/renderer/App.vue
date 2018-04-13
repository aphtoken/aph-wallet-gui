<template>
  <div id="app" v-cloak>
    <div class="drag-area"></div>
    <div id="out-of-date" v-if="isOutOfDate">A new version is available. Please restart to update.</div>
    <router-view></router-view>
    <flash-message class="vue-flash-container"></flash-message>
  </div>
</template>

<script>
let fetchLatestVersionIntervalId;

export default {
  name: 'aphtoken-wallet',

  beforeDestroy() {
    clearInterval(fetchLatestVersionIntervalId);
  },

  beforeMount() {
    this.fetchLatestVersion();

    fetchLatestVersionIntervalId =
      setInterval(this.fetchLatestVersion(), this.$constants.WALLET_VERSION_CHECK);
  },

  computed: {
    isOutOfDate() {
      const latestVersion = this.$store.state.latestVersion;

      return latestVersion && latestVersion > this.$store.state.version;
    },
  },

  created() {
    window.addEventListener('online', this.updateOnlineStatus);
    window.addEventListener('offline', this.updateOnlineStatus);
    this.updateOnlineStatus();
  },

  data() {
    return {
      latestWalletVersion: '',
      online: true,
      outOfDate: false,
    };
  },

  destroyed() {
    window.removeEventListener('online', this.updateOnlineStatus);
    window.removeEventListener('offline', this.updateOnlineStatus);
  },

  methods: {
    fetchLatestVersion() {
      this.$store.dispatch('fetchLatestVersion');
    },

    updateOnlineStatus() {
      this.online = navigator.onLine;
    },
  },
};
</script>

<style lang="scss">
::-webkit-scrollbar {
  width: $border-width;
}

::-webkit-scrollbar-thumb:vertical {
  background: $purple;
}

* {
  box-sizing: border-box;
  letter-spacing: $letter-spacing;
}

a {
  text-decoration: none;

  &:focus {
    outline: none;
  }
}

#app, #app > * {
  height: 100%;

  .vue-flash-container  {
    height: auto;
  }
}

.drag-area {
  -webkit-app-region: drag;
  background:transparent;
  height: $space-lg !important;
  left: 0;
  position: fixed;
  top: 0;
  width: 100%;
}

#out-of-date {
  background: rgba(black, 0.8);
  color: $red;
  font-family: GilroyMedium;
  font-size: toRem(14px);
  height: auto;
  left: 0;
  padding: $space-sm;
  position: fixed;
  right: 0;
  text-align: center;
  top: 0;
  z-index: 10000;
}

.vue-flash-container {
  bottom: $space;
  position: absolute;
  right: $space;
  width: toRem(500px);
  z-index: 10000;
}

.flash__message {
  border-radius: $border-radius;
  border: none;
  margin: 0;
  padding: $space;

  .flash__close-button {
    display: none;
  }

  &.error {
    background: $red;
    color: white;
  }

  &.info {
    background: $purple;
    color: white;
  }

  &.success {
    background: $green;
    color: white;
  }

  &.warning {
    background: $orange;
    color: white;
  }

  & + .flash__message {
    margin-top: $space;
  }
}
</style>
