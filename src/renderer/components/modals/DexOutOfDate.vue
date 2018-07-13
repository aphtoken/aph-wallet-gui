<template>
  <modal-wrapper id="dex-out-of-date-modal">
    <div class="body">
      <h1>Aphelion DEX Out of Date</h1>
      <p>
        The DEX contract has been updated. A corresponding wallet upgrade is required to continue to use the DEX. 
        Please use the controls below to cancel your orders and withdraw your funds from the contract back to your wallet and then download the latest version.
      </p>
    </div>
    <div class="footer">
      <div class="accept-btn" @click="accept">Accept</div>
    </div>
  </modal-wrapper>
</template>

<script>
import ModalWrapper from './ModalWrapper';
export default {
  components: {
    ModalWrapper,
  },

  methods: {
    accept() {
      this.$store.commit('setAcceptDexOutOfDate', true);
    },
  },
};
</script>

<style lang="scss">
#dex-out-of-date-modal {
  .body {
    display: block;
    padding: $space-xl;
    text-align: center;

    h1 {
      font-size: toRem(20px);
      margin: 0 0  $space-lg;
    }

    p {
      line-height: $copy-line-height;
      margin: 0;
    }
  }

  .footer {
    display: flex;

    > * {
      flex: 1;
    }
  }

  .accept-btn {
    @extend %btn-footer-light;
  }
}
</style>

