import EncryptedKey from '@/components/login/EncryptedKey';
import utils from '../utils';

let wrapper;

describe('EncryptedKey.vue', () => {
  beforeEach(() => {
    wrapper = utils.shallow(EncryptedKey);
  });

  it('should render', () => {
    expect(wrapper.contains('#login--encrypted-key')).to.be.true();
  });
});
