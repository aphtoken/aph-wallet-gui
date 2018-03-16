<template>
  <section id="login--wallet-created">
    <div v-if="wallet" class="qr-codes">
      <vue-qrcode :value="wallet._address" :options="{ size: 200 }"></vue-qrcode>
      <vue-qrcode :value="wallet._WIF" :options="{ size: 200 }"></vue-qrcode>
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

  mounted() {
    clipboard.writeText('paste me, bro');

    this.wallet = this.$services.wallets.getOne(this.$route.query.walletName);
  },

  components: {
    VueQrcode,
  },
};
</script>

<style lang="scss">
#login--wallet-created {
  width: 30rem;

  .qr-codes {
    display: flex;
    justify-content: space-between;
  }
}
</style>


