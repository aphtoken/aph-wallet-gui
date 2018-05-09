import Router from 'vue-router';
import Vue from 'vue';
import { wallets } from '../services';

Vue.use(Router);

export default new Router({
  routes: [
    {
      children: [
        {
          components: {
            left: require('@/components/login/Landing').default,
          },
          path: '',
        },
        {
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/Menu').default,
          },
          path: 'menu',
        },
        {
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/CreateWallet').default,
          },
          path: 'create-wallet',
        },
        {
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/WalletCreated').default,
          },
          path: 'wallet-created',
        },
        {
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/SavedWallet').default,
          },
          path: 'saved-wallet',
        },
        {
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/Ledger').default,
          },
          path: 'ledger',
        },
        {
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/EncryptedKey').default,
          },
          path: 'encrypted-key',
        },
        {
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/PrivateKey').default,
          },
          path: 'private-key',
        },
      ],
      component: require('@/components/Login').default,
      path: '/login',
    },
    {
      beforeEnter: (to, from, next) => { // eslint-disable-line
        if (wallets.getCurrentWallet()) {
          return next();
        }

        return next('/login');
      },
      children: [
        {
          children: [
            {
              components: {
                'bottom-left': require('@/components/dashboard/Holdings').default,
                'bottom-right': require('@/components/dashboard/RecentTransactions').default,
                'top-left': require('@/components/dashboard/TokenStats').default,
                'top-right': require('@/components/dashboard/TopRightTile').default,
              },
              path: '',
            },
            {
              components: {
                'bottom-left': require('@/components/dashboard/Holdings').default,
                'bottom-right': require('@/components/dashboard/Contacts').default,
                'top-left': require('@/components/dashboard/TokenStats').default,
                'top-right': require('@/components/dashboard/Send').default,
              },
              path: 'send',
            },
            {
              components: {
                'bottom-left': require('@/components/dashboard/Holdings').default,
                'bottom-right': require('@/components/dashboard/RecentTransactions').default,
                'top-left': require('@/components/dashboard/TokenStats').default,
                'top-right': require('@/components/dashboard/Send').default,
              },
              path: 'confirming',
            },
          ],
          component: require('@/components/Dashboard').default,
          path: 'dashboard',
        },
        {
          component: require('@/components/BuyAph').default,
          path: 'buy-aph',
        },
        {
          children: [
            {
              components: {
                left: require('@/components/assets/Table').default,
              },
              path: '',
            },
          ],
          component: require('@/components/Assets').default,
          path: 'assets',
        },
        {
          children: [
            {
              components: {
                left: require('@/components/history/Table').default,
                right: require('@/components/history/Search').default,
              },
              path: '',
            },
          ],
          component: require('@/components/History').default,
          path: 'history',
        },
        {
          children: [
            {
              components: {
                'bottom-left': require('@/components/settings/AddressBook').default,
                'bottom-right': require('@/components/settings/Wallets').default,
                'top-left': require('@/components/settings/WalletActions').default,
                'top-right': require('@/components/settings/Preferences').default,
              },
              path: '',
            },
          ],
          component: require('@/components/Settings').default,
          path: 'settings',
        },
      ],
      component: require('@/components/AuthenticatedWrapper').default,
      path: '/authenticated',
    },
    {
      path: '*',
      redirect: '/authenticated/dashboard',
    },
  ],
});
