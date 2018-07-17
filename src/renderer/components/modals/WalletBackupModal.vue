<template>
  <modal-wrapper id="aph-wallet-backup-modal">
    <div class="body">
      <p class="help-text">{{$t('saveAndBackupTheKeys')}}</p>
      <p class="help-text">{{$t('ifYouLoseThem')}}</p>
      <div class="qr-codes">
        <div class="qr-code">
          <vue-qrcode :value="$store.state.currentWallet.address" :options="{ backgroundAlpha: 0, size: 150 }"></vue-qrcode>
          <p class="help-text">{{$t('publicAddress')}}</p>
        </div>
        <div class="qr-code">
          <vue-qrcode :value="$store.state.currentWallet.wif" :options="{ backgroundAlpha: 0, size: 150 }"></vue-qrcode>
          <p class="help-text">{{$t('encryptedPrivateKey')}}</p>
        </div>
      </div>
      <div class="data">
        <div class="wallet-data public-address">
          <div class="label">{{$t('publicAddress')}}</div>
          <div class="value">
            <p>{{ $store.state.currentWallet.address }}</p>
            <aph-copy-text :text="$store.state.currentWallet.address"></aph-copy-text>
          </div>
        </div>
        <div class="wallet-data encrypted-key">
          <div class="label">{{$t('encryptedKey')}}</div>
          <div class="value">
            <p>{{ $store.state.currentWallet.encryptedWIF }}</p>
            <aph-copy-text :text="$store.state.currentWallet.encryptedWIF"></aph-copy-text>
          </div>
        </div>
        <div class="wallet-data private-key">
          <div class="label">{{$t('privateKey')}}</div>
          <div class="value">
            <p>{{ $store.state.currentWallet.privateKey }}</p>
            <aph-copy-text :text="$store.state.currentWallet.privateKey"></aph-copy-text>
          </div>
        </div>
        <div class="wallet-data private-key">
          <div class="label">WIF</div>
          <div class="value">
            <p>{{ $store.state.currentWallet.wif }}</p>
            <aph-copy-text :text="$store.state.currentWallet.wif"></aph-copy-text>
          </div>
        </div>
      </div>
      <div class="btn-group">
        <div @click="print()" class="btn print">{{$t('print')}}</div>
      </div>
      <div class="btn-group">
        <div @click="onDone()" class="btn done">{{$t('done')}}</div>
      </div>
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
    onDone: {
      required: true,
      type: Function,
    },
  },
};
</script>

<style lang="scss">
#aph-wallet-backup-modal {
  .content {
    overflow: hidden;
    width: 50%;
  }

  .body {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: auto;
    padding: $space-xl;

    @include lowRes() {
      padding: $space-lg;
    }
  }

  .help-text {
    color: $purple;
    font-family: GilroySemibold;
    font-size: toRem(12px);
    text-transform: uppercase;
  }

  .qr-codes {
    display: flex;
    margin-top: $space;
  }

  .qr-code {
    text-align: center;

    & + .qr-code {
      margin-left: $space-xxl;
    }
  }

  .data {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: $space-lg;

    .wallet-data {
      align-items: center;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: center;

      .label {
        @extend %small-uppercase-grey-label;
      }

      .value {
        display: inline-block;
        position: relative;

        p {
          color: $dark;
          font-family: GilroyMedium;
          font-size: toRem(14px);
          margin: $space-sm 0 $space-lg;
        }

        .aph-copy-text {
          position: absolute;
          right: 0;
          top: $space * .4;
          transform: translate(100%, 0);
        }

        .aph-icon {
          margin-left: $space-sm;
        }
      }

      &.passphrase {
        margin: $space-lg 0 0;
      }
    }
  }
  .btn-group {
    display: flex;
    justify-content: center;
    margin-top: $space-lg;
    max-width: toRem(400px);
    width: 60%;

    a, div {
      &.done {
        @extend %btn;
      }

      &.print {
        @extend %btn-outline;

        color: $purple;
      }
    }

    @include lowRes() {
      margin-top: $space;
    }
  }
}
</style>


