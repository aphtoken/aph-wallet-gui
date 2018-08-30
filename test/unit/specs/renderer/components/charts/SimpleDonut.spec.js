import SimpleDonut from '@/components/charts/SimpleDonut';
import utils from './../utils';

let wrapper;

describe('SimpleDonut.vue', () => {
  context('the percentage is positive', () => {
    beforeEach(() => {
      wrapper = utils.mount(SimpleDonut, {
        propsData: {
          percent: 12.3,
        },
      });
    });

    it('should render with correctly formatted data', () => {
      expect(wrapper.find('.label').text()).contains('24 Hour');
      expect(wrapper.find('.percent').text()).contains('12.3%');
    });
  });

  context('the percentage is negative', () => {
    beforeEach(() => {
      wrapper = utils.mount(SimpleDonut, {
        propsData: {
          label: 'NEGATIVE 24 Hour',
          percent: 12.3,
        },
      });
    });

    it('should render with correctly formatted data', () => {
      expect(wrapper.find('.label').text()).contains('NEGATIVE 24 Hour');
      expect(wrapper.find('.percent').text()).contains('12.3%');
    });
  });
});
