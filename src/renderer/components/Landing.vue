<template>
  <section id="landing">
    <div class="left">
      <aph-icon name="logo"></aph-icon>
      <div class="btn-group">
        <router-link class="login-btn" to="login">
          <aph-icon name="wallet"></aph-icon>
          <p class="">Login</p>
        </router-link>
        <router-link class="create-wallet-btn" to="landing">
          <aph-icon name="create"></aph-icon>
          <p class="">Create Wallet</p>
        </router-link>
      </div>
      <router-link class="settings-btn" to="landing">Settings</router-link>

      <button v-on:click="testCreateWallet">
        Test Create
      </button>
      <button v-on:click="testGetBalances">
        Get Balances
      </button>
    </div>
    <div class="right">
      <video loop muted autoplay>
        <source src="~@/assets/video/login.mp4" type="video/mp4">
      </video>
    </div>
  </section>
</template>

<script>
import neo from '../services/neo';
export default {
  methods: {
    testCreateWallet() {
      neo.createWallet('Test Wallet 1', 'testing', 'testing');
    },
    testGetBalances() {
      neo.fetchRecentTransactions('Test Wallet 1');
    },
  },
};
</script>

<style lang="scss">

#landing {
  display: flex;

  .icon.logo {
    height: 15rem;
  }

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

    svg {
      height: 3rem;
    }
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


