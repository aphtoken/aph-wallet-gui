<template>
  <section id="landing">
    <div class="left">
      <aph-icon class="logo" name="logo"></aph-icon>
      <div class="btn-group">
        <router-link to="login">
          <div class="login-btn">
            <aph-icon name="wallet"></aph-icon>
            <p class="">Login</p>
          </div>
        </router-link>
        <div class="create-wallet-btn">
          <aph-icon name="create"></aph-icon>
          <p class="">Create Wallet</p>
        </div>
      </div>
      <div class="settings-btn">Settings</div>
    </div>
    <div class="right">
      <video loop muted autoplay>
        <source src="~@/assets/video/login.mp4" type="video/mp4">
      </video>
    </div>
  </section>
</template>

<script>
export default {
  //
};
</script>

<style lang="scss">

#landing {
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

    video {
      height: 100%;
    }
  }

  .login-btn, .create-wallet-btn {
    @extend %btn-square;
  }

  .settings-btn {
    @extend %btn-outline;

    margin-top: $space * 5;
  }

  .btn-group {
    display: flex;
    flex-direction: row;
    margin-top: $space * 5;

    > .create-wallet-btn {
      margin-left: $space-lg;
    }
  }
}
</style>


