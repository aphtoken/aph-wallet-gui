<template>
  <div class="aph-token-icon">
    <img :src="imageUrl" @load="imageLoadOnComplete" class="image-preloader"/>
    <template v-if="useImage">
      <img :src="imageUrl" />
    </template>
    <template v-else>
      <img src="~@/assets/img/token-icons/APH.png" v-if="symbol === 'APH'">
      <img src="~@/assets/img/token-icons/GAS.png" v-else-if="symbol === 'GAS'">
      <img src="~@/assets/img/token-icons/NEO.png" v-else-if="symbol === 'NEO'">
      <div class="placeholder" v-else>
        <div class="placeholder-text">{{ symbol }}</div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    symbol: {
      type: String,
    },
  },
  computed: {
    imageUrl() {
      return `https://s3.us-east-2.amazonaws.com/aphelion-public-artifacts/TokenLogos/${this.symbol.toLowerCase()}.png`;
    },
  },

  data() {
    return {
      useImage: false,
    };
  },

  methods: {
    imageLoadOnComplete() {
      this.useImage = true;
    },
  },
};
</script>


<style lang="scss">
.aph-token-icon {
  $iconWidth: toRem(50px);

  font-size: 0;

  .image-preloader {
    display: none;
  }

  img, .placeholder {
    height: $iconWidth;
    width: $iconWidth;
    border-radius: 50%;
  }

  .placeholder {
    align-items: center;
    background: $grey;
    color: white;
    display: flex;
    font-size: 0;
    justify-content: center;

    > * {
      display: block;
      font-size: toRem(14px);
      position: relative;
      top: toRem(1px);
    }
  }
}
</style>
