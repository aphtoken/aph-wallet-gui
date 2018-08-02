<template>
  <div v-if="messageReceiving" 
    :style="{
      'width': `${$el.parentElement.clientWidth}px`, 
      'height': `${$el.parentElement.clientHeight}px`
    }" class="loader-container">
    <div :class="{ 
      'loader': !size, 
      'loader-sm': size === 'small' 
      }">
    </div>
  </div>
</template>

<script>
import { requests } from '../constants';

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
  },

  created() {
    this.storeUnwatchLastMsg = this.$store.watch(
      (state) => {
        return state.lastMessage;
      }, (msg) => {
        if (this.wsMessageType && msg.type && msg.type === this.wsMessageType) {
          this.hide();
        }
      });

    this.storeUnwatchRequests = this.$store.watch(
      (state) => {
        return state.requests[this.identifier];
      }, (request) => {
        if (((this.wsMessageType && request.status === requests.SUCCESS) ||
          (!this.wsMessageType && request.status === requests.PENDING)) && !this.isSilent) {
          this.isVisibleTimeout = setTimeout(this.show.bind(this), this.$constants.timeouts.RENDER_SPINNER);
        }

        if (!this.wsMessageType && request.status === requests.SUCCESS) {
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
      if (this.isVisibleTimeout) {
        clearTimeout(this.isVisibleTimeout);
      }

      this.$el.parentElement.style.position = '';
      this.messageReceiving = false;
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
    },
    size: {
      default: null,
      type: String,
    },
  },
};
</script>

<style lang="scss">

.loader-container {
  position: absolute;
  top: 0px;
  left: 0px;
  .loader {
    @include loader06($size: 36px, $color: $purple, $align: middle);
  }
  .loader-sm {
    @include loader06($size: 25px, $color: $purple, $align: middle, $border-size: 5px);
  }
}
</style>


