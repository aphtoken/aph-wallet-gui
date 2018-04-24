<template>
  <modal-wrapper id="aph-send-with-ledger-modal">
    <div class="body">{{ prompt }}</div>
    <div class="footer">
      <div class="cancel-btn" @click="cancel">Cancel</div>
    </div>
  </modal-wrapper>
</template>

<script>
import ModalWrapper from './ModalWrapper';
export default {
  components: {
    ModalWrapper,
  },

  computed: {
    prompt() {
      if (this.$store.state.showSendRequestLedgerSignature === true) {
        return 'Please confirm the transaction on your Ledger device.';
      }

      return 'Please connect your Ledger device, unlock it and open the NEO application.';
    },
  },

  methods: {
    cancel() {
      this.$services.ledger.close();
      this.onCancel();
      this.$store.commit('setSendInProgress', false);
      this.$store.commit('setShowSendWithLedgerModal', false);
    },
  },

  props: {
    onCancel: {
      required: true,
      type: Function,
    },
  },
};
</script>


<style lang="scss">
#aph-send-with-ledger-modal {
  .body {
    padding: $space-lg;
    text-align: center;
    display: block;

    .aph-input {
      border-color: $dark;
      height: 50px;
      width: 100%;

      &.focused {
        border-color: $purple;
      }

      input {
        color: $dark;
      }

      .aph-icon {
        .fill {
          fill: $dark;
        }
      }

      .placeholder {
        color: $grey;
        font-family: GilroyMedium;
      }

      & + .aph-input {
        margin-top: $space;
      }
    }
  }


  .footer {
    display: flex;

    > * {
      flex: 1;
    }
  }

  .cancel-btn {
    @extend %btn-footer-light;
  }

  .login-btn {
    @extend %btn-footer;
  }
}
</style>

