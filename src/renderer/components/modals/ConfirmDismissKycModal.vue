<template>
  <modal-wrapper id="aph-confirm-dismiss-kyc-modal">
    <div class="body">{{ prompt }}</div>
    <div class="footer">
      <div class="cancel-btn" @click="doContinue">No, continue KYC</div>
      <div class="dismiss-btn" @click="doDismiss">Yes, dismiss</div>
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
        return 'Are you sure you want to dismiss the KYC form before completing and submitting it?';
      },
    },

    methods: {
      doContinue() {
        this.$store.commit('setConfirmDismissKyc', false);
        this.onContinue();
      },
      doDismiss() {
        this.$store.commit('setConfirmDismissKyc', false);
        this.onDismiss();
      },
    },
    props: {
      onDismiss: {
        required: true,
        type: Function,
      },
      onContinue: {
        required: true,
        type: Function,
      },
    },
  };
</script>
<style lang="scss">
  #aph-confirm-dismiss-kyc-modal {
    .body {
      padding: $space-xl;
      text-align: center;
      font-size: toRem(18px);
      display: block;
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

    .dismiss-btn {
      @extend %btn-footer-light;
      border-left: toRem(1px) solid darkgrey ;
    }
  }
</style>

