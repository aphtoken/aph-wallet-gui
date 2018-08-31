<template>
  <section id="login">
    <div class="login-wrapper">
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
  overflow: auto;
  flex-direction: column;

  .login-wrapper {
    display: flex;
    flex: 1 0 auto;
  }

  .left, .right {
    flex: 1 1 0%;
  }

  .left {
    display: flex;
    flex-direction: column;
  }

  .right {
    overflow: hidden;
    position: relative;

    video {
      position: absolute;
      z-index: -1;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: 0 50%;
    }
  }

  .right-content {
    @include transition(background-color);

    align-items: center;
    background-color: rgba($dark, .7);
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    padding: $space-xl;

    &.login {
      background: none;
    }

    &.login-wallet-created {
      background-color: $background;
    }
  }
}
</style>
