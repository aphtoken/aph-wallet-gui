import PortfolioHeader from '@/components/PortfolioHeader';
import Vuex from 'vuex';
import _ from 'lodash';
import utils from './utils';

let actions;
let store;

describe('PortfolioHeader.vue', () => {
  beforeEach(() => {
    actions = {
      fetchPortfolio: _.noop,
    };

    store = new Vuex.Store({
      actions,
      state: {
        portfolio: {
          balance: 200,
          changePercent: 50,
          changeValue: 100,
        },
      },
    });
  });

  it('should render correct contents', () => {
    const wrapper = utils.shallow(PortfolioHeader, { store });

    expect(wrapper.find('h1.underlined').text()).contains('My Portfolio');
    expect(wrapper.find('.balance .amount').text()).contains('$200.00');
    expect(wrapper.find('.change .amount').text()).contains('$100.00');
  });
});
