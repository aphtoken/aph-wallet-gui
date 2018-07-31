<template>
  <div v-if="($isPending(identifier) || (wsMessageType && wsMessageReceiving)) && !isSilent" 
    :style="{
      'width': $parent.$el.clientWidth + 'px', 
      'height': $parent.$el.clientHeight + 'px'
    }" class="loader-container">
    <div class="loader"></div>
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
      return this.$store.state.requests[this.identifier].isSilent;
    },
  },

  created() {
    storeUnwatchLastMsg = this.$store.watch(
      (state) => {
        return state.lastMessage;
      }, (msg) => {
        if (this.wsMessageType && msg.type && msg.type === this.wsMessageType) {
          this.wsMessageReceiving = false;
          this.$parent.$el.style.position = null;
        }
      });

    storeUnwatchRequests = this.$store.watch(
      (state) => {
        return state.requests[this.identifier];
      }, () => {
        console.log(this.identifier);
        if (this.wsMessageType) {
          console.log('PENDING');
          this.wsMessageReceiving = true;
        }

        this.$parent.$el.style.position = 'relative';
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
  },
};
</script>

<style lang="scss">

.loader-container {
  position: absolute;
  top: 0px;
  left: 0px;
  .loader {
    @include loader06($size: 50px, $color: $purple, $align: middle);
  }
}
</style>


