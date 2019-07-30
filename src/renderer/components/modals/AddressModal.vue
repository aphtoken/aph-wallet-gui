<template>
  <modal-wrapper id="aph-address-modal">
    <div class="body">
      <h2 id="headLabel">NEO</h2>
      <div id="demo" class="code">
        <vue-qrcode id="test1" :value="address" :options="{ backgroundAlpha: 0, size: 200 }"></vue-qrcode>
      </div>
      <aph-copy-text :text="address"></aph-copy-text>
      <div class="address">{{ address }}</div>
      <div>
        <br>
        <button class="visit-cmc-btn" value="NEO" @click="callMe">NEO</button>
        <button class="visit-cmc-btn" value="BTC" @click="callMe">BTC</button>
        <button class="visit-cmc-btn" value="ETH" @click="callMe">ETH</button>
      </div>
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
    callMe(element) {
      if (element.target.value === 'NEO') {
        document.getElementById('headLabel').innerHTML = 'NEO';
        this.address = this.neoAddress;
      } else if (element.target.value === 'BTC') {
        document.getElementById('headLabel').innerHTML = 'BTC';
        this.address = this.btcAddress;
      } else {
        document.getElementById('headLabel').innerHTML = 'ETH';
        this.address = this.ethAddress;
      }
    },
  },
  beforeMount() {
    this.address = this.neoAddress;
  },

  props: {
    neoAddress: {
      required: true,
      type: String,
    },

    btcAddress: {
      required: true,
      type: String,
    },

    ethAddress: {
      required: true,
      type: String,
    },
    onDone: {
      required: true,
      type: Function,
    },
  },
  data() {
    return {
      address: this.neoAddress,
    };
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
    font-family: ProximaSemibold;
    font-size: toRem(12px);
    margin-top: $space-sm;
  }

  .done-btn {
    @extend %btn-footer;
  }

   .visit-cmc-btn {
      @extend %btn;
      width: 50px;
      display: inline-block;
    }
}
</style>
