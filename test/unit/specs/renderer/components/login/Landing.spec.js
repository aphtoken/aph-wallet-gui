import Landing from '@/components/login/Landing';
import utils from '../utils';

let wrapper;

describe('Landing.vue', () => {
  beforeEach(() => {
    wrapper = utils.shallow(Landing);
  });

  it('should render', () => {
    expect(wrapper.contains('#login--landing')).to.be.true();
  });
});
