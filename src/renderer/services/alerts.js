import Vue from 'vue';

const MILLISECONDS_PER_WORD = 750;

function countWords(str) {
  return str.trim().split(/\s+/).length;
}

function calculateTimeout(str) {
  return countWords(str) * MILLISECONDS_PER_WORD;
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
      if (e.message.indexOf('Request failed with status code') > -1) {
        this.error('Error reaching NEO data server. Please try again later.');
        console.log(e);
        return;
      }
      this.error(e.message);
    }
  },

};
