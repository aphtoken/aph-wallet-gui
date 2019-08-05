import SavedWallet from '@/components/login/SavedWallet';
import utils from '../utils';

let wrapper;

describe('SavedWallet.vue', () => {
  beforeEach(() => {
    wrapper = utils.shallow(SavedWallet);
  });

  it('should render', () => {
    expect(wrapper.contains('#login--saved-wallet')).to.be.true();
  });
});
