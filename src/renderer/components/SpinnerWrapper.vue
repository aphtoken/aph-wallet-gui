<template>
  <div class="component-wrapper">
    <slot></slot>
    <div v-if="messageReceiving" class="spinner-container">
      <div :class="['spinner', {'spinner-sm': size === 'small'}]">
      </div>
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
    request() {
      return this.$store.state.requests[this.identifier];
    },
    isSilent() {
      return this.request && this.request.isSilent;
    },
  },

  created() {
    this.storeUnwatchLastMsg = this.$store.watch(
      (state) => {
        return state.socket.lastMessage;
      }, (msg) => {
        if (!this.wsMessageType || !this.wsMessageOp || !msg) {
          return;
        }

        if (msg.request && msg.request.op && msg.request.op === this.wsMessageOp &&
          (!this.wsMessageArgs || (msg.request.args && _.startsWith(msg.request.args, this.wsMessageArgs)))) {
          this.show();
        } else if (msg.error || (msg.type && msg.type === this.wsMessageType)) {
          this.hide();
        }
      });

    this.storeUnwatchRequests = this.$store.watch(
      (state) => {
        return state.requests[this.identifier];
      }, (request) => {
        this[request.status === this.$constants.requests.PENDING ? 'show' : 'hide']();
      });
  },

  methods: {
    show() {
      this.clearIsVisibleTimeout();
      if (this.isSilent || this.hideCondition) {
        return;
      }

      this.isVisibleTimeout = setTimeout(() => {
        this.messageReceiving = true;
      },
      this.$constants.timeouts.RENDER_SPINNER);
    },
    hide() {
      this.clearIsVisibleTimeout();
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
    wsMessageArgs: {
      default: null,
      type: String,
      validator(value) {
        // Add additional websocket message args here
        return ['orderBook'].some(arg => _.startsWith(arg, value));
      },
    },
    wsMessageOp: {
      default: null,
      type: String,
      validator(value) {
        // Add additional websocket message ops here
        return _.includes(['subscribe'], value);
      },
    },
    wsMessageType: {
      default: null,
      type: String,
      validator(value) {
        // Add additional websocket message types here
        return _.includes(['bookSnapshot'], value);
      },
    },
    size: {
      default: null,
      type: String,
    },
    hideCondition: {
      default: false,
      type: Boolean,
    },
  },
};
</script>

<style lang="scss">

.component-wrapper {
  display: inherit;
  flex: 1;
  flex-flow: inherit;
  height: inherit;
  position: relative;

  .spinner-container {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    background: rgba($dark, 0.5);
    border-radius: $border-radius;
    
    .spinner {
        &:not(.spinner-sm) {
            @include loader06($size: 36px, $color: $purple, $align: middle);
        }
        &.spinner-sm {
            @include loader06($size: 25px, $color: $purple, $align: middle, $border-size: 5px);
        }
    }
  }
}
</style>


