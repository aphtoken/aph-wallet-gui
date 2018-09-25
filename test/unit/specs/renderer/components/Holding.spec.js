import Holding from '@/components/Holding';
import utils from './utils';

let wrapper;

const opts = {
  propsData: {
    holding: {
      asset: 'Aphelion',
      balance: 100,
      change24hrPercent: 2,
      contractBalance: 10,
      name: 'Aphelion',
      openOrdersBalance: 15,
      symbol: 'APH',
    },
  },
  stubs: {
    'aph-token-icon': require('@/components/TokenIcon.vue').default,
  },
};

describe('Holding.vue', () => {
  context('positive 24 hour change', () => {
    it('should render with correctly formatted data', () => {
      wrapper = utils.mount(Holding, opts);

      expect(wrapper.find('.name').text()).contains('Aphelion');
      expect(wrapper.find('.currency').text()).contains('APH');
      expect(wrapper.find('.formatted').text()).contains('100');
      expect(wrapper.find('.currency').text()).contains('APH');
      expect(wrapper.find('.increase').text()).contains('2');
    });
  });

  context('negative 24 hour change', () => {
    it('should render with correctly formatted data', () => {
      wrapper = utils.mount(Holding, _.set(opts, 'propsData.holding.change24hrPercent', -3));

      expect(wrapper.find('.name').text()).contains('Aphelion');
      expect(wrapper.find('.currency').text()).contains('APH');
      expect(wrapper.find('.formatted').text()).contains('100');
      expect(wrapper.find('.currency').text()).contains('APH');
      expect(wrapper.find('.decrease').text()).contains('3');
    });
  });
});
