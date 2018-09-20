import Vue from 'vue';
import Router from 'vue-router';

import { wallets } from '../services';

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
          path: 'ledger',
          components: {
            left: require('@/components/login/Logo').default,
            right: require('@/components/login/Ledger').default,
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
      path: '/authenticated',
      component: require('@/components/AuthenticatedWrapper').default,
      beforeEnter: (to, from, next) => { // eslint-disable-line
        if (wallets.getCurrentWallet()) {
          return next();
        }

        return next('/login');
      },
      children: [
        {
          path: 'dashboard',
          component: require('@/components/Dashboard').default,
          children: [
            {
              path: '',
              components: {
                'bottom-left': require('@/components/dashboard/Holdings').default,
                'bottom-right': require('@/components/dashboard/RecentTransactions').default,
                'top-left': require('@/components/dashboard/TokenStats').default,
                'top-right': require('@/components/dashboard/TopRightTile').default,
              },
            },
            {
              path: 'send',
              components: {
                'bottom-left': require('@/components/dashboard/Holdings').default,
                'bottom-right': require('@/components/dashboard/Contacts').default,
                'top-left': require('@/components/dashboard/TokenStats').default,
                'top-right': require('@/components/dashboard/Send').default,
              },
              beforeEnter() {
                console.log('************************');
                console.log('beforeEnter');
                console.log('************************');
              },
            },
            {
              path: 'confirming',
              components: {
                'bottom-left': require('@/components/dashboard/Holdings').default,
                'bottom-right': require('@/components/dashboard/RecentTransactions').default,
                'top-left': require('@/components/dashboard/TokenStats').default,
                'top-right': require('@/components/dashboard/Send').default,
              },
            },
          ],
        },
        {
          path: 'buy-aph',
          component: require('@/components/BuyAph').default,
        },
        {
          path: 'commit',
          component: require('@/components/Commit').default,
        },
        {
          path: 'dex',
          component: require('@/components/Dex').default,
          meta: {
            isMenuToggleable: true,
            showTransactionsSidebar: false, // TODO: enable this later when it shows pending transactions.
          },
          children: [
            {
              path: '',
              components: {
                'left-top': require('@/components/dex/MarketSelection').default,
                'left-bottom': require('@/components/dex/OrderForm').default,
                'middle-top': require('@/components/dex/Chart').default,
                'middle-bottom': require('@/components/dex/OrderHistory').default,
                'right-top': require('@/components/dex/OrderBook').default,
                'right-bottom': require('@/components/dex/TradeHistory').default,
              },
            },
          ],
        },
        {
          path: 'assets',
          component: require('@/components/Assets').default,
          children: [
            {
              path: '',
              components: {
                left: require('@/components/assets/AssetTable').default,
              },
            },
          ],
        },
        {
          path: 'token-sale',
          component: require('@/components/TokenSale').default,
        },
        {
          path: 'history',
          component: require('@/components/History').default,
          children: [
            {
              path: '',
              components: {
                left: require('@/components/history/Table').default,
                right: require('@/components/history/Search').default,
              },
            },
          ],
        },
        {
          path: 'settings',
          component: require('@/components/Settings').default,
          children: [
            {
              path: '',
              components: {
                'bottom-left': require('@/components/settings/AddressBook').default,
                'bottom-right': require('@/components/settings/Wallets').default,
                'top-left': require('@/components/settings/WalletActions').default,
                'top-right': require('@/components/settings/Preferences').default,
              },
            },
          ],
        },
      ],
    },
    {
      path: '*',
      redirect: '/authenticated/dashboard',
    },
  ],
});
