<template>
  <section id="login--wallet-created" v-if="wallet">
    <p class="help-text">
      You must save and backup the keys below. If you lose them, you lose access to your assets. You can click "Save Key" to save the encrypted key in local application storage.
    </p>
    <p class="help-text">
      Verify that you can log in to the account and see the correct public address before sending anything to the address below!
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
    <div class="wallet-data passphrase">
      <div class="label">Passphrase</div>
      <div class="value">
        <p>{{ wallet.passphrase }}</p>
        <span class="copy-link" @click="copy(wallet.passphrase)">
          <aph-icon name="copy"></aph-icon>
        </span>
      </div>
    </div>
    <div class="wallet-data public-address">
      <div class="label">Public Address</div>
      <div class="value">
        <p>{{ wallet.address }}</p>
        <span class="copy-link" @click="copy(wallet.address)">
          <aph-icon name="copy"></aph-icon>
        </span>
      </div>
    </div>
    <div class="wallet-data encrypted-key">
      <div class="label">Encrypted Key</div>
      <div class="value">
        <p>{{ wallet.encryptedWIF }}</p>
        <span class="copy-link" @click="copy(wallet.encryptedWIF)">
          <aph-icon name="copy"></aph-icon>
        </span>
      </div>
    </div>
    <div class="wallet-data private-key">
      <div class="label">Private Key</div>
      <div class="value">
        <p>{{ wallet.privateKey }}</p>
        <span class="copy-link" @click="copy(wallet.privateKey)">
          <aph-icon name="copy"></aph-icon>
        </span>
      </div>
    </div>
    <div class="btn-group">
      <router-link to="#" class="print">Print</router-link>
      <router-link to="dashboard" class="done">Done</router-link>
    </div>
  </section>
</template>

<script>
import VueQrcode from '@xkeshi/vue-qrcode';
import { clipboard } from 'electron';

export default {
  data() {
    return {
      wallet: null,
    };
  },

  methods: {
    copy(text) {
      clipboard.writeText(text);
    },
  },

  mounted() {
    this.wallet = this.$services.wallets.getCurrentWallet();
  },

  components: {
    VueQrcode,
  },
};
</script>

<style lang="scss">
#login--wallet-created {
  width: 75%;

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
    justify-content: space-around;
    margin-top: $space-xl;
  }

  .qr-code {
    text-align: center;
  }

  .wallet-data {
    text-align: center;

    .label {
      @extend %small-uppercase-grey-label;
    }

    .value {
      display: inline-block;
      position: relative;

      p {
        color: $dark;
        font-size: toRem(15px);
        margin: $space-sm 0 $space;
      }

      .copy-link {
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
      margin: $space-lg 0;
    }
  }

  .btn-group {
    display: flex;
    justify-content: center;
    margin-top: $space-lg;

    a {
      @extend %btn-outline;

      &.print, &.done {
        background: $purple;
      }

      & + a {
        margin-left: $space-lg;
      }
    }
  }
}
</style>


