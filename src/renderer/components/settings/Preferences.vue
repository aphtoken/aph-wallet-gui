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
        <div class="label">Network</div>
        <aph-select :light="true" :options="networks" :initialValue="selectedNetwork" v-model="selectedNetwork" :allow-empty-value="false"></aph-select>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  beforeMount() {
    this.currencies = this.$services.settings.getCurrencies();
    this.networks = this.$services.network.getNetworks();
    this.selectedCurrency = this.$services.settings.getCurrency();
    this.selectedNetwork = _.find(this.networks, (o) => {
      return o.value.net === this.$services.network.getSelectedNetwork().net;
    }).value;
  },

  data() {
    return {
      currencies: [],
      networks: [],
      selectedCurrency: null,
      selectedNetwork: null,
    };
  },

  watch: {
    selectedCurrency(currency) {
      this.$services.settings.setCurrency(currency).sync();
    },

    selectedNetwork(network) {
      if (network.net === this.$store.state.currentNetwork.net) {
        return;
      }
      this.$services.network.setSelectedNetwork(network);
      this.$services.alerts.success(`Switched to ${network.net}`);
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

      & + .row {
        margin-top: $space-lg;
      }
    }
  }
}
</style>
