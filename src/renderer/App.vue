<template>
  <div id="app" :class="routeClass" v-cloak>
    <div class="drag-area"></div>
    <router-view></router-view>
    <flash-message class="vue-flash-container"></flash-message>
    <div id="fixed-notifications">
      <div id="out-of-date" v-if="isNewerAppVersionAvailable">{{$t('newVersionAvailable')}} <a :href="newVersionDownloadUrl" :title="newVersionDownloadUrl" target="_blank">{{$t('clickHere')}}</a> {{$t('toDownload')}} v{{this.$store.state.latestVersion.version}}.</div>
      <!-- <div id="demo-dex" v-if="shouldShowDexDemoWarning">{{$t('testDEXVersion')}}</div> -->
    </div>
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
    const shell = require('electron').shell;
    document.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && e.target.target === '_blank' && e.target.href.startsWith('http')) {
        e.preventDefault();
        shell.openExternal(e.target.href);
      }
    });

    this.fetchLatestVersion();
    fetchLatestVersionIntervalId = setInterval(() => {
      this.fetchLatestVersion();
    }, this.$constants.intervals.WALLET_VERSION_CHECK);
  },

  computed: {
    isNewerAppVersionAvailable() {
      return this.$store.state.latestVersion
        && this.$store.state.latestVersion.version > this.$store.state.version;
    },

    newVersionDownloadUrl() {
      if (process.platform === 'darwin') {
        return this.$store.state.latestVersion.downloadUrlMac;
      } else if (process.platform === 'linux') {
        return this.$store.state.latestVersion.downloadUrlLin;
      } else if (process.platform === 'win32') {
        return this.$store.state.latestVersion.downloadUrlWin;
      }
      return '';
    },

    routeClass() {
      return _.kebabCase(this.$route.path);
    },

    shouldShowDexDemoWarning() {
      return this.$route.path === '/authenticated/dex';
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
@import 'assets/scss/base';

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

#fixed-notifications {
  background: rgba(black, 0.8);
  color: $red;
  font-family: GilroyMedium;
  font-size: toRem(14px);
  height: auto;
  left: 0;
  position: fixed;
  right: 0;
  text-align: center;
  top: 0;
  z-index: 10000;

  > * {
    padding: $space-sm;
  }

  a {
    color: white;
    cursor: pointer;

    &:hover {
      color: white;
    }
  }
}
</style>
