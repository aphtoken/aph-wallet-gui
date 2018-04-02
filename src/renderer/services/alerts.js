import Vue from 'vue';

export default {

  success(message) {
    Vue.prototype.$flashStorage.flash(message, 'success', {
      timeout: 15 * 1000,
    });
  },
  info(message) {
    Vue.prototype.$flashStorage.flash(message, 'info', {
      timeout: 15 * 1000,
    });
  },
  warning(message) {
    Vue.prototype.$flashStorage.flash(message, 'warning', {
      timeout: 15 * 1000,
    });
  },
  error(message) {
    Vue.prototype.$flashStorage.flash(message, 'error', {
      timeout: 30 * 1000,
    });
  },
  exception(e) {
    console.log(e);
    this.error(e.message);
  },

};
