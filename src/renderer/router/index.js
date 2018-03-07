import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/landing',
      component: require('@/components/Landing').default,
    },
    {
      path: '/login',
      component: require('@/components/Login').default,
      children: [
        {
          path: '',
          component: require('@/components/login/Menu').default,
        },
        {
          path: 'saved-wallet',
          component: require('@/components/login/SavedWallet').default,
        },
      ],
    },
    {
      path: '*',
      redirect: '/landing',
    },
  ],
});
