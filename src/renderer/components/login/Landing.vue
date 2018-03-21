<template>
  <section id="login--landing">
    <aph-icon name="logo"></aph-icon>
    <div class="btn-group">
      <router-link class="login-btn" to="/login/menu">
        <aph-icon name="wallet"></aph-icon>
        <p>Login</p>
      </router-link>
      <router-link class="create-wallet-btn" to="/login/create-wallet">
        <aph-icon name="create"></aph-icon>
        <p>Create Wallet</p>
      </router-link>
    </div>
    <router-link class="settings-btn" to="login">Settings</router-link>
  </section>
</template>

<script>
export default {
  //
};
</script>

<style lang="scss">
#login--landing {
  align-items: center;
  display: flex;
  flex-direction: column;

  .icon.logo {
    height: 15rem;
  }

  .login-btn, .create-wallet-btn {
    @extend %btn-square;

    box-shadow: 0 0 100px 10px rgba($purple, .25);
  }

  .settings-btn {
    @extend %btn-outline;

    color: $purple;
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


