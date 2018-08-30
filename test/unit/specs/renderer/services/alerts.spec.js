import Vue from 'vue';
import sinon from 'sinon';

import { alerts } from '@/services';

let flash;

describe('services/alerts', () => {
  beforeEach(() =>  {
    flash = sinon.spy();

    Vue.prototype.$flashStorage = { flash };
  });

  describe('success', () => {
    beforeEach(() => {
      alerts.success('This is an alert');
    });

    it('correctly dispatch the alert', () => {
      expect(flash).to.have.been.calledWith(
        'This is an alert',
        'succes',
        { timeout: 1234 },
      );
    });
  });
});
