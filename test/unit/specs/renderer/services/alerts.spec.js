import Vue from 'vue';
import moment from 'moment';
import sinon from 'sinon';

import { alerts } from '@/services';
import { store } from '@/store';

window.moment = moment;

let flash;

describe('services/alerts', () => {
  beforeEach(() => {
    const storage = [];
    flash = sinon.spy();

    Vue.prototype.$flashStorage = { flash, storage };
  });

  describe('success', () => {
    beforeEach(() => {
      alerts.success('This is an alert');
    });

    it('should correctly dispatch the alert', () => {
      expect(flash).to.have.been.calledWith(
        'This is an alert',
        'success',
        { timeout: 3000 },
      );
    });
  });

  describe('info', () => {
    beforeEach(() => {
      alerts.info('This is an alert');
    });

    it('should correctly dispatch the alert', () => {
      expect(flash).to.have.been.calledWith(
        'This is an alert',
        'info',
        { timeout: 3000 },
      );
    });
  });

  describe('warning', () => {
    beforeEach(() => {
      alerts.warning('This is an alert');
    });

    it('should correctly dispatch the alert', () => {
      expect(flash).to.have.been.calledWith(
        'This is an alert',
        'warning',
        { timeout: 3000 },
      );
    });
  });

  describe('error', () => {
    context('the error does not already exist', () => {
      beforeEach(() => {
        alerts.error('This is an alert');
      });

      it('should correctly dispatch the alert', () => {
        expect(flash).to.have.been.calledWith(
          'This is an alert',
          'error',
          { timeout: 3000 },
        );
      });
    });

    context('the error already exists', () => {
      beforeEach(() => {
        Vue.prototype.$flashStorage.storage = [{
          content: 'This is an alert',
          type: 'error',
        }];

        alerts.error('This is an alert');
      });

      it('should not dispatch the alert', () => {
        expect(flash).to.not.have.been.called();
      });
    });
  });

  describe('exception', () => {
    context('the argument is a string', () => {
      beforeEach(() => {
        alerts.exception('This is an alert');
      });

      it('should correctly dispatch the alert', () => {
        expect(flash).to.have.been.calledWith(
          'This is an alert',
          'error',
          { timeout: 3000 },
        );
      });
    });

    context('the argument is an Error', () => {
      beforeEach(() => {
        alerts.exception(new Error('This is an alert'));
      });

      it('should correctly dispatch the alert', () => {
        expect(flash).to.have.been.calledWith(
          'This is an alert',
          'error',
          { timeout: 3000 },
        );
      });
    });

    context('the argument is an Error with copy \'Network Error\'', () => {
      beforeEach(() => {
        alerts.exception(new Error('Network Error'));
      });

      it('should not dispatch the alert', () => {
        expect(flash).to.not.have.been.called();
      });
    });
  });

  describe('networkException', () => {
    context('the argument is a string', () => {
      beforeEach(() => {
        alerts.networkException('This is an alert');
      });

      it('should correctly dispatch the alert', () => {
        expect(flash).to.have.been.calledWith(
          'This is an alert',
          'error',
          { timeout: 3000 },
        );
      });
    });

    context('a network error has been has been dispatched within the threshold', () => {
      beforeEach(() => {
        store.commit('setLastReceivedBlock');
        alerts.networkException('This is an alert');
      });

      it('should correctly dispatch the alert only once', () => {
        expect(flash).to.not.have.been.called();
      });
    });
  });
});
