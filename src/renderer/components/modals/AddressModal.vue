<template>
  <modal-wrapper id="aph-address-modal">
    <div class="body">
      <div class="code">
        <vue-qrcode :value="address" :options="{ backgroundAlpha: 0, size: 200 }"></vue-qrcode>
      </div>
      <aph-copy-text :text="address"></aph-copy-text>
      <div class="address">{{ address }}</div>
    </div>
    <div class="footer">
      <div class="done-btn" @click="onDone">{{$t('done')}}</div>
    </div>
  </modal-wrapper>
</template>

<script>
import VueQrcode from '@xkeshi/vue-qrcode';

import ModalWrapper from './ModalWrapper';

export default {
  components: {
    ModalWrapper,
    VueQrcode,
  },

  methods: {
    print() {
      window.print();
    },
  },

  props: {
    address: {
      required: true,
      type: String,
    },

    onDone: {
      required: true,
      type: Function,
    },
  },
};
</script>

<style lang="scss">
#aph-address-modal {
  .body {
    padding: $space-lg;
    text-align: center;
  }

  .aph-copy-text {
    margin-top: $space;
    text-align: center;
  }

  .address {
    font-family: GilroySemibold;
    font-size: toRem(12px);
    margin-top: $space-sm;
  }

  .done-btn {
    @extend %btn-footer;
  }
}
</style>


