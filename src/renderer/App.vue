<template>
  <div id="app" v-cloak>
    <div class="drag-area"></div>
    <router-view></router-view>
    
    <flash-message class="vue-flash-container"></flash-message>
  </div>
</template>

<script>
export default {
  name: 'aphtoken-wallet',

  created() {
    window.addEventListener('online', this.updateOnlineStatus);
    window.addEventListener('offline', this.updateOnlineStatus);
    this.updateOnlineStatus();
  },

  data() {
    return {
      online: true,
    };
  },

  destroyed() {
    window.removeEventListener('online', this.updateOnlineStatus);
    window.removeEventListener('offline', this.updateOnlineStatus);
  },

  methods: {
    updateOnlineStatus() {
      this.online = navigator.onLine;
    },
  },
};
</script>

<style lang="scss">
#app, #app > * {
  height: 100%;
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
</style>
