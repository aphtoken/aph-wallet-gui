<template>
  <div class="price">
    <div class="header">
      <h1 class="underlined">Price</h1>
      <div class="current-value">
        <div class="label">Tue Mar 20</div>
        <div class="amount">$1.43</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {

};
</script>

<style lang="scss">
.price {
  background: white;
  border-radius: $border-radius;
  display: flex;
  flex-direction: column;
  padding: $space;

  .header {
    display: flex;
    flex: none;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }

    .current-value {
      flex: none;
      text-align: right;

      .amount {
        color: $purple;

        font-family: GilroyMedium;
      }
    }
  }

  .label {
    @extend %small-uppercase-grey-label;

    margin-bottom: $space-sm;
  }
}
</style>

