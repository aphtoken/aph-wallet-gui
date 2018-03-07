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
        <div class="btn-group">
          <router-link class="saved-wallet-btn" to="login">
            Saved wallet
          </router-link>
          <router-link class="encrypted-key-btn" to="login">
            Encrypted key
          </router-link>
          <router-link class="private-key-btn" to="login">
            Private key
          </router-link>
        </div>
      </div>
    </div>
    <router-link to="landing" class="back-link">
      <div class="back-btn">
        <aph-icon name="back"></aph-icon>
      </div>
    </router-link>
  </section>
</template>
<script>
export default {

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
    background: rgba($dark-grey, .7);
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

  .btn-group {
    a {
      color: white;
      display: block;

      & + a {
        margin-top: $space-lg;
      }
    }
  }

  .back-link {
    left: 50%;
    position: absolute;
    bottom: 15%;
    transform: translate(-50%, -50%);
  }

  .back-btn {
    @extend %btn-circle;

    box-shadow: 0px 0px 30px 10px rgba($purple, .25);
  }

  .saved-wallet-btn, .encrypted-key-btn, .private-key-btn {
    @extend %btn-outline;
  }
}
</style>


