<template>
  <section id="login--logo">
    <aph-icon id="login--logo" name="logo"></aph-icon>
    <div class="version-number">
      {{version}}
    </div>
    <div class="back-btn" @click="back">
      <aph-icon name="back"></aph-icon>
    </div>
  </section>
</template>

<script>
const pjson = require('../../../../package.json');
export default {
  computed: {
    version() {
      return `v${pjson.version}`;
    },
  },

  methods: {
    back() {
      this.$router.back();
    },
  },
};
</script>

<style lang="scss">
#login--logo {
  .icon.logo {
    height: 20rem;
  }
  text-align: center;

  .back-btn {
    @extend %btn-circle;

    bottom: 15%;
    left: 50%;
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 100;
  }
}
</style>

