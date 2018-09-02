<template>
  <section id="login--logo">
    <aph-icon id="login--logo" name="logo"></aph-icon>
    <div class="version-number">v{{$store.state.version}}</div>
    <div class="back-btn" @click="back">
      <aph-icon name="back"></aph-icon>
    </div>
  </section>
</template>

<script>
export default {
  methods: {
    back() {
      this.$router.back();
    },
  },
};
</script>

<style lang="scss">
#login--logo {
  flex: 0 0 auto;
  text-align: center;
  margin: auto;
  padding: $space-xl;

  .icon.logo {
    height: 20rem;
  }

  .version-number {
    @extend %small-uppercase-grey-label;
  }

  .back-btn {
    @extend %btn-circle;

    bottom: 15%;
    left: 50%;
    position: absolute;
    z-index: 100;
    margin-left: toRem(-65px / 2);

    &:hover {
      box-shadow: $box-shadow-sm;
    }
  }
}
</style>
