<template>
  <modal-wrapper id="aph-address-modal">
    <div class="body">
      <div class="code">
        <vue-qrcode :value="address" :options="{ backgroundAlpha: 0, size: 200 }"></vue-qrcode>
      </div>
      <div class="copy-link" @click="copy()">
        <aph-icon name="copy"></aph-icon>
      </div>
      <div class="address">{{ address }}</div>
    </div>
    <div class="footer">
      <div class="done-btn" @click="onDone">Done</div>
    </div>
  </modal-wrapper>
</template>

<script>
import VueQrcode from '@xkeshi/vue-qrcode';
import { clipboard } from 'electron';

import ModalWrapper from './ModalWrapper';

export default {
  components: {
    ModalWrapper,
    VueQrcode,
  },

  methods: {
    copy() {
      clipboard.writeText(this.address);
    },

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

  .copy-link {
    margin-top: $space;
    text-align: center;

    path {
      fill: $grey;
    }

    svg {
      cursor: pointer;
      height: $space;

      &:hover {
        path {
          fill: $purple;
        }
      }
    }
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


