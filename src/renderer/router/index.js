import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/login',
      component: require('@/components/Login').default,
      children: [
        {
          path: '',
          components: {
            left: require('@/components/login/Landing').default,
          },
        },
        {
          path: 'menu',
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/Menu').default,
          },
        },
        {
          path: 'create-wallet',
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/CreateWallet').default,
          },
        },
        {
          path: 'wallet-created',
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/WalletCreated').default,
          },
        },
        {
          path: 'saved-wallet',
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/SavedWallet').default,
          },
        },
        {
          path: 'encrypted-key',
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/EncryptedKey').default,
          },
        },
        {
          path: 'private-key',
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/PrivateKey').default,
          },
        },
      ],
    },
    {
      path: '/dashboard',
      component: require('@/components/Dashboard').default,
      children: [
        {
          path: 'home',
          components: {
            bottomLeft: null,
            bottomRight: null,
            header: require('@/components/PortfolioHeader').default,
            topLeft: null,
            topRight: null,
          },
        },
      ],
    },
    {
      path: '*',
      redirect: '/dashboard/home',
    },
  ],
});
