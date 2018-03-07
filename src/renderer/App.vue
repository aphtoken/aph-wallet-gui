<template>
  <div id="app" v-cloak>
    <router-view></router-view>
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

</style>
