import sinon from 'sinon';

import PortfolioHeader from '@/components/PortfolioHeader';
import utils from './utils';

let push;
let wrapper;

describe('PortfolioHeader.vue', () => {
  beforeEach(() => {
    const customState = {
      portfolio: {
        balance: 200,
        changePercent: 50,
        changeValue: 100,
      },
    };

    const opts = {
      stubs: {
        'address-modal': '<div id="aph-address-modal" />',
        'aph-icon': '<div />',
        zoom: '<div />',
      },
    };

    wrapper = utils.mount(PortfolioHeader, opts, customState);
  });

  it('should render with correctly formatted data', () => {
    expect(wrapper.find('h1.underlined').text()).contains('My Portfolio');
    expect(wrapper.find('.balance .amount').text()).contains('$200.00');
    expect(wrapper.find('.change .amount').text()).contains('$100.00');
  });

  context('when a user clicks the receive button', () => {
    beforeEach(() => {
      wrapper.vm.$services.wallets.setCurrentWallet({ address: 'address' });
      wrapper.find('.receive-btn').trigger('click');
    });

    it('should show the address modal component', () => {
      expect(wrapper.contains('#aph-address-modal')).to.be.true();
    });
  });

  context('when a user clicks the send button', () => {
    beforeEach(() => {
      push = wrapper.vm.$router.push = sinon.spy();
      wrapper.find('.send-btn').trigger('click');
    });

    it('should update the route', () => {
      expect(push).to.have.been.calledWith('/authenticated/dashboard/send');
    });
  });
});
