<template>
  <modal-wrapper id="aph-fracture-gas-modal">
    <div class="header">{{$t('fractureGas')}}</div>
    <div class="body">
      <p>
        {{$t('fractureGasMessage1', {
        walletBalance: $store.state.fractureGasModalModel.walletBalance,
        currentOutputsAboveFee: $store.state.fractureGasModalModel.currentOutputsAboveFee,
        recommendedUTXOs: $store.state.fractureGasModalModel.recommendedUTXOs,
        fee: $store.state.fractureGasModalModel.fee,
        })}}</p>
      <p>
        {{$t('fractureGasMessage2')}}
      </p>
    </div>
    <div class="footer">
      <button class="close-btn" @click="neverAsk()">{{$t('neverAskAgain')}}</button>
      <button class="close-btn" @click="notNow()">{{$t('notRightNow')}}</button>
      <button class="fracture-gas-btn" @click="fracture()"
        :disabled="shouldDisableFractureButton">{{sending ? $t('sending') : $t('yesFracture')}}</button>
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
    shouldDisableFractureButton() {
      return this.sending;
    },
  },

  data() {
    return {
      sending: false,
    };
  },

  methods: {
    neverAsk() {
      this.$services.settings.setGasFracture(false);
      this.onClose();
    },

    notNow() {
      this.onClose();
    },

    fracture() {
      this.$services.settings.setGasFracture(true);
      this.sending = true;
      this.$services.neo.fractureGAS(this.$store.state.fractureGasModalModel.recommendedUTXOs,
        this.$store.state.fractureGasModalModel.fee)
        .then(() => {
          this.$services.alerts.success(this.$t('sentFracture'));
          this.onClose();
        })
        .catch((e) => {
          this.$services.alerts.exception(e);
        });
    },
  },

  props: {
    onClose: {
      required: true,
      type: Function,
    },
  },
};
</script>
<style lang="scss">
#aph-fracture-gas-modal {
  .content {
    width: toRem(700px);
  }

  .header {
    font-size: toRem(20px);
    padding: $space-lg $space-lg 0;   
  }

  .body {
    padding: $space $space-lg $space-lg;
  }

  .footer {
    text-align:center;
    display: flex;

    > * {
      flex: 1;
    }
  }

  .close-btn {
    @extend %btn-footer-light;

    border-bottom-left-radius: $border-radius;
  }

  .fracture-gas-btn {
    @extend %btn-footer;

    border-bottom-right-radius: $border-radius;
  }
}
</style>

