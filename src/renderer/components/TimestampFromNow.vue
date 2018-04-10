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

      const seconds = this.now.diff(moment.utc(this.timestamp), 'seconds');

      switch (true) {
        case seconds <= 1:
          return 'a second ago';
        case seconds < 60:
          return `${seconds} seconds ago`;
        default:
          return moment.utc(this.timestamp).fromNow();
      }
    },
  },

  data() {
    return {
      now: null,
    };
  },

  props: {
    timestamp: String,
  },

  created() {
    this.now = moment.utc();

    this.interval = setInterval(() => {
      this.now = moment.utc();
    }, 1000);
  },
};
</script>
