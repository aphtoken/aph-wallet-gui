import Vuex from 'vuex';
import _ from 'lodash';

import PortfolioHeader from '@/components/PortfolioHeader';
import utils from './utils';

let actions;
let store;

const i18n = utils.getI18n({
  en: {
    myPortfolio: 'My Portfolio',
  },
});

describe('PortfolioHeader.vue', () => {
  beforeEach(() => {
    actions = {
      fetchPortfolio: _.noop,
    };

    store = new Vuex.Store({
      state: {
        portfolio: {
          balance: 200,
          changePercent: 50,
          changeValue: 100,
        },
      },
      actions,
    });
  });

  it('should render correct contents', () => {
    const wrapper = utils.shallow(PortfolioHeader, { i18n, store });

    expect(wrapper.find('h1.underlined').text()).contains('My Portfolio');
    expect(wrapper.find('.balance .amount').text()).contains('$200.00');
    expect(wrapper.find('.change .amount').text()).contains('$100.00');
  });
});
