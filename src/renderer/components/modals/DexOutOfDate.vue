<template>
  <modal-wrapper id="dex-out-of-date-modal">
    <div class="body">
      <h1>{{$t('aphelionDexOutOfDate')}}</h1>
      <p>
        {{$t('theDexContractHasBeenUpdated')}}
      </p>
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

