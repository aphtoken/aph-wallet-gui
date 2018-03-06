<template>
  <section id="login">
    <div class="left">
      <aph-icon class="logo" name="logo"></aph-icon>
      <div class="login-btn-group">
        <div class="btn login-btn">
          <aph-icon name="wallet"></aph-icon>
          <p class="">Login</p>
        </div>
        <div class="btn create-wallet-btn">
          <aph-icon name="create"></aph-icon>
          <p class="">Create Wallet</p>
        </div>
      </div>
      <div class="settings-btn-group">
        <div class="btn-outline">Settings</div>
      </div>
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

<style lang="scss" scoped>

#login {
  display: flex;
}

.left, .right {
  flex: 1;
}

.right {
  overflow: hidden;

  video {
    height: 100%;
  }
}

.left {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.right {
  background: $purple;
}

.logo {
  display: flex;
  justify-content: center;
}

.btn {
  background: white;
  border-radius: 6px;
  border: none;
  box-shadow: 0px 0px 100px 10px rgba($light-purple, .25);
  color: $purple;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: $space * 10;
  width: $space * 10;

  .aph-icon {
    align-items: center;
    display: flex;
    flex: 1;
    justify-content: center;
  }

  p {
    font-size: .8rem;
    margin: $space 0;
    text-align: center;
  }

  &:hover {
    background: $light-purple;
    color: white;
  }
}

.btn-outline {
  border-radius: 4px;
  border: 3px solid $light-purple;
  color: $light-purple;
  cursor: pointer;
  font-size: .8rem;
  padding: $space-sm;
  text-align: center;
  width: $space * 10;

  &:hover {
    background: $light-purple;
    color: white;
  }
}

.login-btn-group, .settings-btn-group {
  display: flex;
  flex-direction: row;
  margin-top: $space * 5;

  > .btn:not(:first-child) {
    margin-left: $space-lg;
  }
}
</style>


