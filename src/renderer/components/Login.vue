<template>
  <section id="login">
    <div class="left">
      <aph-icon class="logo" name="logo"></aph-icon>
    </div>
    <div class="right">
      <video loop muted autoplay>
        <source src="~@/assets/video/login.mp4" type="video/mp4">
      </video>
      <div class="right-content">
        <router-view></router-view>
      </div>
    </div>
    <div class="back-btn" @click="back">
      <aph-icon name="back"></aph-icon>
    </div>
  </section>
</template>
<script>
export default {
  methods: {
    back() {
      this.$router.back();
    },
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
  }

  .back-btn {
    @extend %btn-circle;

    bottom: 15%;
    box-shadow: 0px 0px 30px 10px rgba($purple, .25);
    left: 50%;
    position: absolute;
    transform: translate(-50%, -50%);
  }
}
</style>


