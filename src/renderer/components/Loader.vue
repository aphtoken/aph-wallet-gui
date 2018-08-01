<template>
  <div v-if="($isPending(identifier) || (wsMessageType && wsMessageReceiving)) && !isSilent" 
    :style="{
      'width': $el.parentElement.clientWidth + 'px', 
      'height': $el.parentElement.clientHeight + 'px'
    }" class="loader-container">
    <div :class="{ 'loader': !size, 'loader-sm': size === 'small' }"></div>
  </div>
</template>

<script>
let storeUnwatchLastMsg;
let storeUnwatchRequests;
export default {
  data() {
    return {
      wsMessageReceiving: false,
    };
  },

  computed: {
    isSilent() {
      return this.$store.state.requests[this.identifier] && this.$store.state.requests[this.identifier].isSilent;
    },
  },

  created() {
    storeUnwatchLastMsg = this.$store.watch(
      (state) => {
        return state.lastMessage;
      }, (msg) => {
        if (this.wsMessageType && msg.type && msg.type === this.wsMessageType) {
          this.wsMessageReceiving = false;
          this.$el.parentElement.style.position = '';
        }
      });

    storeUnwatchRequests = this.$store.watch(
      (state) => {
        return state.requests[this.identifier];
      }, (request) => {
        if (this.wsMessageType && request.status === 'success') {
          this.wsMessageReceiving = true;
          this.$el.parentElement.style.position = 'relative';
        } else if (!this.wsMessageType && request.status === 'pending' && !this.isSilent) {
          this.$el.parentElement.style.position = 'relative';
        } else if (!this.wsMessageType && request.status === 'success' && !this.isSilent) {
          this.$el.parentElement.style.position = '';
        }
      });
  },

  beforeDestroy() {
    storeUnwatchLastMsg();
    storeUnwatchRequests();
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


