<template>
 <span>{{ displayTimestamp }}</span>
</template>

<script>
export default {
  beforeDestroy() {
    clearInterval(this.interval);
  },

  computed: {
    displayTimestamp() {
      if (!this.now || !this.timestamp) {
        return '--';
      }

      const seconds = this.now.diff(moment.unix(this.timestamp), 'seconds');

      switch (true) {
        case seconds <= 1:
          return this.$t('aSecondAgo');
        case seconds < 60:
          return this.$t('secondsAgo', { seconds });
        default:
          return moment.unix(this.timestamp).fromNow();
      }
    },
  },

  data() {
    return {
      now: null,
    };
  },

  props: ['timestamp'],

  created() {
    this.now = moment.utc();

    this.interval = setInterval(() => {
      this.now = moment.utc();
    }, 1000);
  },
};
</script>
