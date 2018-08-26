import Vuex from 'vuex';
import _ from 'lodash';

import PortfolioHeader from '@/components/PortfolioHeader';
import utils from './utils';


const address = 'address';
const i18n = utils.getI18n({
  en: {
    myPortfolio: 'My Portfolio',
  },
});

let wrapper;

describe('PortfolioHeader.vue', () => {
  beforeEach(() => {
    const store = new Vuex.Store({
      actions: {
        fetchPortfolio: _.noop,
      },
      getters: {
        showSendAddressModal(state) {
          return state.showSendAddressModal;
        },
      },
      mutations: {
        setShowSendAddressModal(state, value) {
          return state.showSendAddressModal = value;
        },
      },
      state: {
        portfolio: {
          balance: 200,
          changePercent: 50,
          changeValue: 100,
        },
        showSendAddressModal: false,
      },
    });

    wrapper = utils.mount(PortfolioHeader, { i18n, store });
    wrapper.vm.$services.wallets.setCurrentWallet({ address });
  });

  it('should render correct contents', () => {
    expect(wrapper.find('h1.underlined').text()).contains('My Portfolio');
    expect(wrapper.find('.balance .amount').text()).contains('$200.00');
    expect(wrapper.find('.change .amount').text()).contains('$100.00');
  });

  it('should show show address modal', () => {
    wrapper.find('.receive-btn').trigger('click');

    expect(wrapper.contains('#aph-address-modal')).to.be.true;
  });
});
