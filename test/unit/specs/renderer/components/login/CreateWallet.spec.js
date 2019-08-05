import CreateWallet from '@/components/login/CreateWallet';
import utils from '../utils';

let wrapper;

describe('CreateWallet.vue', () => {
  beforeEach(() => {
    wrapper = utils.shallow(CreateWallet);
  });

  it('should render', () => {
    expect(wrapper.contains('#login--create-wallet')).to.be.true();
  });
});
