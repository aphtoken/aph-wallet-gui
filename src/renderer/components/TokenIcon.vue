<template>
  <div class="token-icon">
    <img src="~@/assets/img/token-icons/APH.png" v-if="symbol === 'APH'">
    <img src="~@/assets/img/token-icons/GAS.png" v-else-if="symbol === 'GAS'">
    <img src="~@/assets/img/token-icons/NEO.png" v-else-if="symbol === 'NEO'">
    <div class="placeholder" v-else>
      <span>{{ symbol }}</span>
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
};
</script>


<style lang="scss">
.token-icon {
  $width: toRem(50px);

  font-size: 0;

  img, .placeholder {
      height: $width;
      width: $width;
  }

  .placeholder {
    align-items: center;
    background: #d5d5e0;
    border-radius: 50%;
    color: white;
    display: flex;
    justify-content: center;
    font-size: toRem(12px);
    font-family: GilroyMedium;

    > * {
      position: relative;
      top: 2px;
    }
  }
}
</style>
