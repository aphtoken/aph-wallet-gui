<template>
  <section id="settings--preferences">
    <div class="header">
      <h1 class="underlined">Preferences</h1>
    </div>
    <div class="body">
      <div class="row">
        <div class="label">Currency</div>
        <aph-select :light="true" :options="currencies" :initialValue="selectedCurrency" v-model="selectedCurrency" :allow-empty-value="false"></aph-select>
      </div>

      <div class="row">
        <div class="label">Currency</div>
        <aph-select :light="true" :options="currencies" :initialValue="selectedCurrency" v-model="selectedCurrency" :allow-empty-value="false"></aph-select>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  beforeMount() {
    this.currencies = this.$services.settings.getCurrencies();
    this.selectedCurrency = this.$services.settings.getCurrency();
  },

  data() {
    return {
      currencies: [],
      selectedCurrency: null,
    };
  },

  watch: {
    selectedCurrency(currency) {
      this.$services.settings.setCurrency(currency).sync();
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
