<template>
  <section id="login--landing">
    <aph-icon name="logo"></aph-icon>
    <div class="version-number">v{{$store.state.version}}</div>
    <!--<locale-changer></locale-changer>-->
    <div class="btn-group">
      <router-link class="login-btn" to="/login/menu">
        <aph-icon name="wallet"></aph-icon>
        <p>{{ $t('login') }}</p>
      </router-link>
      <router-link class="create-wallet-btn" to="/login/create-wallet">
        <aph-icon name="create"></aph-icon>
        <p>{{ $t('createWallet') }}t</p>
      </router-link>
    </div>
    <!-- <router-link class="settings-btn" to="login">Settings</router-link> -->
  </section>
</template>

<script>
import LocaleChanger from '../LocaleChanger';

export default {
  components: {
    LocaleChanger,
  },
};
</script>

<style lang="scss">
#login--landing {
  align-items: center;
  display: flex;
  flex-direction: column;

  .icon.logo {
    height: 20rem;
  }

  .version-number {
    @extend %small-uppercase-grey-label-dark;
  }

  .login-btn, .create-wallet-btn {
    @extend %btn-square;

    box-shadow: $box-shadow-lg;
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
      margin-left: $space-xl;
    }

    svg {
      &.wallet {
        height: toRem(44px);
      }
    }
  }
}
</style>


