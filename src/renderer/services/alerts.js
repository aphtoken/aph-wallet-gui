/** eslint-disable no-use-before-define */
import Vue from 'vue';
import _ from 'lodash';

const MILLISECONDS_PER_WORD = 750;

function countWords(str) {
  return str.trim().split(/\s+/).length;
}

function calculateTimeout(str) {
  return countWords(str) * MILLISECONDS_PER_WORD;
}

function errorAlreadyExists(content) {
  return !!_.find(Vue.prototype.$flashStorage.storage, (item) => {
    return item.type === 'error' && item.content === content;
  });
}

export default {

  success(message) {
    Vue.prototype.$flashStorage.flash(message, 'success', {
      timeout: calculateTimeout(message),
    });
  },

  info(message) {
    Vue.prototype.$flashStorage.flash(message, 'info', {
      timeout: calculateTimeout(message),
    });
  },

  warning(message) {
    Vue.prototype.$flashStorage.flash(message, 'warning', {
      timeout: calculateTimeout(message),
    });
  },

  error(message) {
    if (errorAlreadyExists(message)) {
      return;
    }

    Vue.prototype.$flashStorage.flash(message, 'error', {
      timeout: calculateTimeout(message),
    });
  },

  exception(e) {
    console.log(e);
    if (!e.message) {
      this.error(e);
    } else {
      if (e.message === 'Network Error') {
        // absorb these errors, so we don't constantly alert the user if they are not online
        // maybe some other kind of offline indicator?
        return;
      }
      this.error(e.message);
    }
  },

};
