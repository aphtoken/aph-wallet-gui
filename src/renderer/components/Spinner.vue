<template>
  <div v-if="messageReceiving" 
    :style="{
      'width': `${parentWidth}px`, 
      'height': `${parentHeight}px`
    }" class="spinner-container">
    <div :class="{ 
      'spinner': !size, 
      'spinner-sm': size === 'small' 
      }">
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      messageReceiving: false,
      storeUnwatchLastMsg: null,
      storeUnwatchRequests: null,
      isVisibleTimeout: null,
    };
  },

  computed: {
    isSilent() {
      return this.$store.state.requests[this.identifier] &&
        this.$store.state.requests[this.identifier].isSilent;
    },
    parentWidth() {
      return this.$el.parentElement.clientWidth;
    },
    parentHeight() {
      return this.$el.parentElement.clientHeight;
    },
  },

  created() {
    this.storeUnwatchLastMsg = this.$store.watch(
      (state) => {
        return state.socket.lastMessage;
      }, (msg) => {
        if (this.wsMessageType && msg.type && msg.type === this.wsMessageType) {
          this.hide();
        }
      });

    this.storeUnwatchRequests = this.$store.watch(
      (state) => {
        return state.requests[this.identifier];
      }, (request) => {
        if (((this.wsMessageType && request.status === this.$constants.requests.SUCCESS) ||
          (!this.wsMessageType && request.status === this.$constants.requests.PENDING)) && !this.isSilent) {
          this.clearIsVisibleTimeout();
          this.isVisibleTimeout = setTimeout(this.show.bind(this), this.$constants.timeouts.RENDER_SPINNER);
        }

        if (!this.wsMessageType && request.status === this.$constants.requests.SUCCESS) {
          this.hide();
        }
      });
  },

  methods: {
    show() {
      this.messageReceiving = true;
      this.$el.parentElement.style.position = 'relative';
    },
    hide() {
      this.clearIsVisibleTimeout();
      this.$el.parentElement.style.position = '';
      this.messageReceiving = false;
    },
    clearIsVisibleTimeout() {
      if (this.isVisibleTimeout) {
        clearTimeout(this.isVisibleTimeout);
      }
    },
  },

  beforeDestroy() {
    this.storeUnwatchLastMsg();
    this.storeUnwatchRequests();
    this.clearIsVisibleTimeout();
  },

  props: {
    identifier: {
      default: null,
      type: String,
    },
    wsMessageType: {
      default: null,
      type: String,
      validator(value) {
        // Add additional websocket message types here
        return ['bookSnapshot'].indexOf(value) !== -1;
      },
    },
    size: {
      default: null,
      type: String,
    },
  },
};
</script>

<style lang="scss">

.spinner-container {
  position: absolute;
  top: 0px;
  left: 0px;
  .spinner {
    @include loader06($size: 36px, $color: $purple, $align: middle);
  }
  .spinner-sm {
    @include loader06($size: 25px, $color: $purple, $align: middle, $border-size: 5px);
  }
}
</style>


