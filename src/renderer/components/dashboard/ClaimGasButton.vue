<template>
  <button class="claim-gas-button" @click="claim" :disabled="$isPending('claimGas')">{{ buttonLabel }}</button>
</template>

<script>
export default {
  computed: {
    buttonLabel() {
      return this.$isPending('claimGas') ? 'Claiming...' : `Claim ${this.formattedAmountToClaim} Gas`;
    },

    formattedAmountToClaim() {
      return this.$formatNumber(this.$store.state.statsToken.availableToClaim);
    },
  },

  methods: {
    claim() {
      this.$store.dispatch('claimGas');
    },
  },
};
</script>

<style lang="scss">
.claim-gas-button {
  @extend %btn;
  @extend %small-uppercase-grey-label-dark;

  background-color: $dark;
  border-color: transparent;
  border-radius: toRem(2px);
  color: white;
  height: auto;
  padding: $space-xs $space;
  text-transform: uppercase;

  &:hover {
    background-color: $purple;
  }

  &:disabled {
    background-color: $background;
    color: $grey;
  }
}
</style>

