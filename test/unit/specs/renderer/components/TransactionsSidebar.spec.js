import sinon from 'sinon';

import TransactionsSidebar from '@/components/TransactionsSidebar';
import utils from './utils';

const RECENT_TRANSACTIONS = [
  {
    from: 'from',
    to: 'to',
    value: 1,
  },
  {
    from: 'from',
    to: 'to',
    value: -1,
  },
];
const COMPUTED_TRANSACTIONS = [
  {
    address: 'from',
    from: 'from',
    to: 'to',
    value: 1,
  },
  {
    address: 'to',
    from: 'from',
    to: 'to',
    value: -1,
  },
];

let wrapper;

describe('TransactionsSidebar.vue', () => {
  beforeEach(() => {
    TransactionsSidebar.methods.loadTransactions = sinon.spy();

    const customState = {
      recentTransactions: RECENT_TRANSACTIONS,
    };

    const opts = {
      stubs: {
        'aph-icon': require('@/components/Icon.vue').default,
        'aph-simple-transactions': '<div />',
      },
    };

    wrapper = utils.mount(TransactionsSidebar, opts, customState);
  });

  it('should render with correctly formatted data', () => {
    expect(wrapper.find('h1.underlined').text()).contains('Recent transactions');
    expect(wrapper.contains('#transactions-sidebar')).to.be.true();
  });

  it('should properly compute computed properties', () => {
    expect(wrapper.vm.transactions).to.eql(COMPUTED_TRANSACTIONS);
  });

  it('should fetch transactions', () => {
    expect(TransactionsSidebar.methods.loadTransactions).to.have.been.calledOnce();
  });

  context('the user clicks the toggle to open', () => {
    beforeEach(() => {
      wrapper.find('.toggle').trigger('click');
    });

    it('should show the correct icon', () => {
      expect(wrapper.contains('.icon.double-arrow-right')).to.be.true();
    });
  });

  context('the user clicks the toggle to close', () => {
    beforeEach(() => {
      wrapper.setData({ open: true });
      wrapper.find('.toggle').trigger('click');
    });

    it('should show the correct icon', () => {
      expect(wrapper.contains('.icon.history')).to.be.true();
    });
  });

  context('the component is destroyed', () => {
    beforeEach(() => {
      window.clearInterval = sinon.spy();
      wrapper.destroy();
    });

    it('should clear the interval', () => {
      expect(window.clearInterval).to.have.been.calledOnce();
    });
  });
});
