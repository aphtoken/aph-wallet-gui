<template>
  <section id="backup-wallet" v-if="wallet">
    <p class="help-text">
      Save and backup the keys below.
    </p>
    <p class="help-text">
      If you lose them, you lose access to your assets.
    </p>
    <div v-if="wallet" class="qr-codes">
      <div class="qr-code">
        <vue-qrcode :value="wallet.address" :options="{ backgroundAlpha: 0, size: 150 }"></vue-qrcode>
        <p class="help-text">Public Address</p>
      </div>
      <div class="qr-code">
        <vue-qrcode :value="wallet.wif" :options="{ backgroundAlpha: 0, size: 150 }"></vue-qrcode>
        <p class="help-text">Encrypted Private Key</p>
      </div>
    </div>

    <div class="data">
      <div class="wallet-data public-address">
        <div class="label">Public Address</div>
        <div class="value">
          <p>{{ wallet.address }}</p>
          <aph-copy-text :text="wallet.address"></aph-copy-text>
        </div>
      </div>
      <div class="wallet-data encrypted-key">
        <div class="label">Encrypted Key</div>
        <div class="value">
          <p>{{ wallet.encryptedWIF }}</p>
          <aph-copy-text :text="wallet.encryptedWIF"></aph-copy-text>
        </div>
      </div>
      <div class="wallet-data private-key">
        <div class="label">Private Key</div>
        <div class="value">
          <p>{{ wallet.privateKey }}</p>
          <aph-copy-text :text="wallet.privateKey"></aph-copy-text>
        </div>
      </div>
      <div class="wallet-data private-key">
        <div class="label">WIF</div>
        <div class="value">
          <p>{{ wallet.wif }}</p>
          <aph-copy-text :text="wallet.wif"></aph-copy-text>
        </div>
      </div>
    </div>
    <div class="btn-group">
      <div @click="print()" class="btn print">Print</div>
    </div>
  </section>
</template>

<script>
import VueQrcode from '@xkeshi/vue-qrcode';

export default {
  data() {
    return {
      wallet: null,
    };
  },

  methods: {
    print() {
      window.print();
    },
  },

  beforeDestroy() {
    this.wallet = null;
    this.$store.commit('setWalletBackup', null);
  },

  mounted() {
    this.wallet = this.$store.state.walletBackup;
  },

  components: {
    VueQrcode,
  },
};
</script>

<style lang="scss">
#backup-wallet {
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 1000px;
  background-color: white;
  padding: 2rem;

  .help-text {
    color: $purple;
    font-family: GilroySemibold;
    font-size: toRem(12px);
    line-height: $line-height;
    text-align: center;
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
    margin-top: $space-lg;
    
    .wallet-data {
      text-align: center;
      flex: 1;

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
      @extend %btn-outline;

      &.done {
        background: $purple;

        &:hover {
          background-color: $purple-hover;
        }
      }

      &.print {
        color: $purple;

        &:hover {
          color: white;
        }
      }

      & + a {
        margin-left: $space-lg;
      }
    }
  }
}
</style>


