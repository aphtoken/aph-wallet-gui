<template>
  <section id="settings--preferences">
    <div class="header">
      <h1 class="underlined">Preferences</h1>
    </div>
    <div class="body">
      <div class="row">
        <div class="label">Currency</div>
        <aph-select :light="true" :options="currencies" :initialValue="selectedCurrency" v-model="selectedCurrency"></aph-select>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  beforeMount() {
    this.selectedCurrency = this.$services.settings.getCurrency();
  },

  data() {
    return {
      currencies: [
        {
          label: 'USD',
          value: 'USD',
        },
        {
          label: 'EUR',
          value: 'EUR',
        },
        {
          label: 'JPY',
          value: 'JPY',
        },
        {
          label: 'GBP',
          value: 'GBP',
        },
        {
          label: 'CHF',
          value: 'CHF',
        },
        {
          label: 'CAD',
          value: 'CAD',
        },
      ],

      selectedCurrency: null,
    };
  },

  watch: {
    selectedCurrency(currency) {
      this.$services.settings.setCurrency(currency);
    },
  },
};
</script>

<style lang="scss">
#settings--preferences {
  @extend %tile-light;

  .header {
    padding: $space-lg;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    padding: 0 $space-lg $space-lg;

    .row {
      .label {
        @extend %small-uppercase-grey-label;

        margin-bottom: $space;
      }
    }
  }
}
</style>
