<template>
  <section id="login--landing">
    <aph-icon name="logo"></aph-icon>
    <div class="btn-group">
      <router-link class="login-btn" to="/login/menu">
        <aph-icon name="wallet"></aph-icon>
        <p class="">Login</p>
      </router-link>
      <router-link class="create-wallet-btn" to="/login/create-wallet">
        <aph-icon name="create"></aph-icon>
        <p class="">Create Wallet</p>
      </router-link>
    </div>
    <router-link class="settings-btn" to="/landing">Settings</router-link>
    <button v-on:click="testCreateWallet">
      Test Create
    </button>
    <button v-on:click="testGetBalances">
      Get Balances
    </button>
  </section>
</template>

<script>
export default {
  methods: {
    testCreateWallet() {
      this.$services.neo.createWallet('Test Wallet 9999', 'testing', 'testing')
        .then((data) => {
          debugger;
          return data;
        })
        .catch((error) => {
          debugger;
          return error;
        });
    },
    testGetBalances() {
      this.$services.neo.fetchRecentTransactions('Test Wallet 1');
    },
  },
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


