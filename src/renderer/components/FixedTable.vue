<template>
  <div class="aph-fixed-table">
    <div class="scroll" ref="scroll">
      <table class="table">
        <thead ref="thead">
          <tr>
            <slot name="headers"></slot>
          </tr>
        </thead>
        <tbody>
          <slot></slot>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  beforeDestroy() {
    this.$refs.scroll.removeEventListener('scroll', this.fixHeader);
  },

  methods: {
    fixHeader() {
      this.$refs.thead.style.transform = `translate(0, ${this.$refs.scroll.scrollTop}px)`;
    },
  },

  mounted() {
    this.$refs.scroll.addEventListener('scroll', this.fixHeader);
  },
};
</script>

<style lang="scss">
.aph-fixed-table {
  .scroll {
    .table {
      @extend %dex-table;
    }
  }
}
</style>

