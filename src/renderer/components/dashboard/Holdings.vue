<template>
  <div class="holdings">
    <div class="header">
      <h1 class="underlined">My holdings</h1>
    </div>
  </div>
</template>

<script>
export default {

};
</script>

<style lang="scss">
.holdings {
  display: flex;
  flex-direction: column;

  .header {
    padding: $space;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }
}
</style>

