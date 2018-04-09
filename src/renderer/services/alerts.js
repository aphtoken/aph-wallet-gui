import Vue from 'vue';

const MILLISECONDS_PER_WORD = 1250;

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
    this.error(e.message);
  },

};
