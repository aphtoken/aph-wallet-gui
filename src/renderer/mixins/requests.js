export default {
  methods: {
    $isDone(identifier) {
      return _.get(this.$store.state.requests, `${identifier}.status`) === this.$constants.requests.SUCCESS;
    },

    $isFailed(identifier) {
      return _.get(this.$store.state.requests, `${identifier}.status`) === this.$constants.requests.FAILED;
    },

    $isPending(identifier) {
      return _.get(this.$store.state.requests, `${identifier}.status`) === this.$constants.requests.PENDING;
    },
  },
};
