<template>
  <modal-wrapper id="aph-wallet-backup-modal">
    <div class="body">
      <p class="help-text">Save and backup the keys below.</p>
      <p class="help-text">If you lose them, you lose access to your assets.</p>
      <div class="qr-codes">
        <div class="qr-code">
          <vue-qrcode :value="$store.state.currentWallet.address" :options="{ backgroundAlpha: 0, size: 150 }"></vue-qrcode>
          <p class="help-text">Public Address</p>
        </div>
        <div class="qr-code">
          <vue-qrcode :value="$store.state.currentWallet.wif" :options="{ backgroundAlpha: 0, size: 150 }"></vue-qrcode>
          <p class="help-text">Encrypted Private Key</p>
        </div>
      </div>
      <div class="data">
        <div class="wallet-data public-address">
          <div class="label">Public Address</div>
          <div class="value">
            <p>{{ $store.state.currentWallet.address }}</p>
            <aph-copy-text :text="$store.state.currentWallet.address"></aph-copy-text>
          </div>
        </div>
        <div class="wallet-data encrypted-key">
          <div class="label">Encrypted Key</div>
          <div class="value">
            <p>{{ $store.state.currentWallet.encryptedWIF }}</p>
            <aph-copy-text :text="$store.state.currentWallet.encryptedWIF"></aph-copy-text>
          </div>
        </div>
        <div class="wallet-data private-key">
          <div class="label">Private Key</div>
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
        <div @click="print()" class="btn print">Print</div>
      </div>
      <div class="btn-group">
        <div @click="onDone()" class="btn done">Done</div>
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
    line-height: $line-height;
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

          .aph-icon {
            min-height: auto;
          }
        }

        .aph-icon {
          cursor: pointer;
          margin-left: $space-sm;

          path {
            fill: $grey;
          }

          svg {
            height: $space;
          }

          &:hover {
            path {
              fill: $purple;
            }
          }
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


