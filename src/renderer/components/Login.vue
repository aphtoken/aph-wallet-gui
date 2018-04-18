<template>
  <section id="login">
    <div class="left">
      <router-view name="left"></router-view>
    </div>
    <div class="right">
      <video loop muted autoplay>
        <source src="~@/assets/video/login.mp4" type="video/mp4">
      </video>
      <div :class="['right-content', routeClassName]">
        <router-view name="right"></router-view>
      </div>
    </div>
  </section>
</template>
<script>
export default {
  beforeDestroy() {
    this.$store.commit('resetRequests');
  },

  computed: {
    routeClassName() {
      return _.kebabCase(this.$route.path);
    },
  },

  mounted() {
    if (this.$services.wallets.getCurrentWallet()) {
      this.$router.push('/authenticated/dashboard');
    }
  },
};
</script>

<style lang="scss">
#login {
  display: flex;

  .left, .right {
    flex: 1;
  }

  .left {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .right {
    overflow: hidden;
    position: relative;

    video {
      bottom: 0;
      height: 100%;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
    }
  }

  .right-content {
    align-items: center;
    background: rgba($dark, .7);
    bottom: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;

    &.login-wallet-created {
      background: $background;
    }
  }
}
</style>


