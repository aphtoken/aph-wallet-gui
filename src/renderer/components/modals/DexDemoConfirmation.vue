<template>
  <modal-wrapper id="dex-demo-confirmation-modal">
    <div class="body">
      <h1>Aphelion DEX Test Version</h1>
      <p>This is a preliminary demo and testing verion of the Aphelion DEX. It operates on Neo Testnet, which may exhibit degraded performance. Mainnet coming soon.</p>
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
      this.$store.commit('setAcceptDexDemoVersion', true);
    },
  },
};
</script>


<style lang="scss">
#dex-demo-confirmation-modal {
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

