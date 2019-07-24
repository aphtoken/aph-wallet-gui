<template>
  <div class="aph-radio" :class="[{ selected: selected }]" @click="$emit('click')">
    <div v-if="selected" class="dot"></div>
  </div>
</template>

<script>
export default {
  props: {
    selected: {
      default: false,
      type: Boolean,
    },
  },
};
</script>

<style lang="scss">
.aph-radio {
  font-size: 0;
  line-height: 1;
  border: 2px solid $grey;
  height: 20px;
  width: 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;


  &.selected {
    border-color: $purple;
  }

  .dot {
    border-radius: 10px;
    background: $purple;
    height: 10px;
    width: 10px;
  }
}
</style>
