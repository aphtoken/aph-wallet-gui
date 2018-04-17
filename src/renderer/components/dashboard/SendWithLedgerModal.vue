<template>
  <div id="aph-send-with-ledger-modal">
    <div class="content">
      <div class="body">
        {{ prompt }}
      </div>
      <div class="footer">
        <div class="cancel-btn" @click="cancel">Cancel</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
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
    },
  },
};
</script>


<style lang="scss">
#aph-send-with-ledger-modal {
  align-items: center;
  background: rgba($dark, 0.8);
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 9999;

  .content {
    background: white;
    flex: none;
    width: toRem(600px);
  }

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

