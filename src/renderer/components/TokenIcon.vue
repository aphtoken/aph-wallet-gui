<template>
  <div class="aph-token-icon">
    <img src="~@/assets/img/token-icons/APH.png" v-if="symbol === 'APH'">
    <img src="~@/assets/img/token-icons/GAS.png" v-else-if="symbol === 'GAS'">
    <img src="~@/assets/img/token-icons/NEO.png" v-else-if="symbol === 'NEO'">
    <div class="placeholder" v-else>
      <span>{{ symbol }}</span>
      <img :src="imageUrl" onerror="this.style.display='none';this.parentNode.classList.add('default');"/>
    </div>
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
};
</script>


<style lang="scss">
.aph-token-icon {
  $iconWidth: toRem(50px);

  font-size: 0;

  img, .placeholder {
      height: $iconWidth;
      width: $iconWidth;
  }

  .placeholder {
    align-items: center;
    color: white;
    display: flex;
    justify-content: center;
    font-size: toRem(12px);
    font-family: GilroyMedium;
    position: relative;

    span {
      display: none;
    }
    &.default {
      background: $grey;
      border-radius: 50%;
      span {
        display: block;
      }
    }
    
    > * {
      position: absolute;
      max-width: 100%;
      max-height: 100%;
    }
  }
}
</style>
