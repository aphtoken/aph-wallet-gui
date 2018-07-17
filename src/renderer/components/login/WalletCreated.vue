<template>
  <section id="login--wallet-created" v-if="wallet">
    <p class="help-text">
      {{$t('yourKeysAreNowEncryptedAs', { lable: wallet.label })}}
    </p>
    <p class="help-text">
      {{$t('youMustSaveAndBackupTheKeys')}}
    </p>
    <p class="help-text">
      {{$t('ifYouLoseThem')}}
    </p>
    <div v-if="wallet" class="qr-codes">
      <div class="qr-code">
        <vue-qrcode :value="wallet.address" :options="{ backgroundAlpha: 0, size: 150 }"></vue-qrcode>
        <p class="help-text">{{$t('publicAddress')}}</p>
      </div>
      <div class="qr-code">
        <vue-qrcode :value="wallet.wif" :options="{ backgroundAlpha: 0, size: 150 }"></vue-qrcode>
        <p class="help-text">{{$t('encryptedPrivateKey')}}</p>
      </div>
    </div>
    <div class="wallet-data passphrase">
      <div class="label">{{$t('passphrase')}}</div>
      <div class="value">
        <p>{{ wallet.passphrase }}</p>
        <aph-copy-text :text="wallet.passphrase"></aph-copy-text>
      </div>
    </div>
    <div class="wallet-data public-address">
      <div class="label">{{$t('publicAddress')}}</div>
      <div class="value">
        <p>{{ wallet.address }}</p>
        <aph-copy-text :text="wallet.address"></aph-copy-text>
      </div>
    </div>
    <div class="wallet-data encrypted-key">
      <div class="label">{{$t('encryptedKey')}}</div>
      <div class="value">
        <p>{{ wallet.encryptedWIF }}</p>

        <aph-copy-text :text="wallet.encryptedWIF"></aph-copy-text>
      </div>
    </div>
    <div class="wallet-data private-key">
      <div class="label">{{$t('privateKey')}}</div>
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
    <div class="btn-group">
      <div @click="print()" class="btn print">{{$t('print')}}</div>
    </div>
    <div class="btn-group">
      <router-link to="dashboard" class="done">{{$t('goToMyWallet')}}</router-link>
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
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 75%;

  .help-text {
    color: $purple;
    font-family: GilroySemibold;
    font-size: toRem(12px);
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


