<template>
  <modal-wrapper id="dex-demo-confirmation-modal">
    <div class="body">
      <!-- TODO: Remove tech debt added here since we are hijacking this DexDemoConfirmation.vue to show MainNet. -->
      <h1>{{$t('aphelionDexMain')}}</h1>
      <p>{{$t('aphelionDexIntro')}}</p>
    </div>
    <div class="footer">
      <div class="accept-btn" @click="accept">{{$t('accept')}}</div>
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
      this.$store.commit('setShowLearnMore', false);
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

