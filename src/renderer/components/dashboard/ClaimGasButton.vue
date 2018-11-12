<template>
  <button class="claim-gas-button" @click="claim" :disabled="$isPending('claimGas')">{{ buttonLabel }}</button>
</template>

<script>
export default {
  computed: {
    buttonLabel() {
      return this.$isPending('claimGas') ? this.$t('claiming')
        : this.$t('claimGas', { gas: this.formattedAmountToClaim });
    },
    formattedAmountToClaim() {
      return this.neoAsset ?
        this.$formatNumber(this.neoAsset.availableToClaim) : 0;
    },
    neoAsset() {
      return _.find(this.$store.state.holdings, { symbol: 'NEO' });
    },
  },

  methods: {
    claim() {
      if (this.neoAsset.availableToClaim > 0) {
        this.$store.dispatch('claimGas');
      }
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
  width: auto;

  &:hover {
    background-color: $purple;
  }

  &:disabled {
    background-color: $background;
    color: $grey;
  }
}
</style>

