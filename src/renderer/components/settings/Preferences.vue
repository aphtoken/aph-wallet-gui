<template>
  <section id="settings--preferences">
    <div class="header">
      <h1 class="underlined">{{$t('preferences')}}</h1>
    </div>
    <div class="body">
      <div class="row">
        <div class="column">
          <div class="label">{{$t('language')}}</div>
          <aph-select :light="true"
                      :options="languages"
                      :initialValue="selectedLanguage"
                      v-model="selectedLanguage"
                      :allow-empty-value="false"></aph-select>
        </div>
        <div class="column">
          <div class="label">{{$t('currency')}}</div>
          <aph-select :light="true" :options="currencies" :initialValue="selectedCurrency" v-model="selectedCurrency" :allow-empty-value="false"></aph-select>
        </div>
      </div>

      <div class="row">
        <div class="column">
          <div class="label">{{$t('network')}}</div>
          <aph-select :light="true" :options="networks" :isDisabledTooltip="$t('networkSwitchBtnDisabled')" :isDisabled="shouldDisableNetworkSelection" :initialValue="selectedNetwork" v-model="selectedNetwork" :allow-empty-value="false"></aph-select>
        </div>
        <div class="column">
          <div class="label">{{$t('networkFee')}}</div>
          <aph-select :light="true" :options="networkFees" :initialValue="selectedNetworkFee" v-model="selectedNetworkFee" :allow-empty-value="false"></aph-select>
        </div>
      </div>
      <div class="row">
        <div class="column fracture-gas" @click="toggleGasFracture">
          <aph-icon name="radio-on" v-if="$store.state.gasFracture"></aph-icon>
          <aph-icon name="radio-off" v-else></aph-icon>
          <label>{{ $t('fractureGas') }}</label>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  beforeMount() {
    this.currencies = this.$services.settings.getCurrenciesAsArray();
    this.networks = this.$services.network.getNetworks();
    this.networkFees = this.$services.network.getNetworkFees().reduce(
      (result, fee) => {
        result.push({
          label: this.$formatNumber(fee),
          value: fee,
        });

        return result;
      }, []);
    this.languages = this.$constants.languages;
    this.selectedLanguage = localStorage.getItem('language') || 'en';
    this.selectedCurrency = this.$services.settings.getCurrency();

    const storedNetwork = this.$services.network.getSelectedNetwork();
    this.selectedNetwork = _.find(this.networks, ({ value }) => {
      return value.net === storedNetwork.net;
    }).value;

    if (!this.selectedNetwork && this.networks && this.networks.length > 0) {
      this.selectedNetwork = this.networks[0];
    }

    if (storedNetwork) {
      this.selectedNetwork.fee = storedNetwork.fee;
      this.selectedNetworkFee = storedNetwork.fee;
    } else {
      this.selectedNetworkFee = 0;
    }
  },

  data() {
    return {
      currencies: [],
      networks: [],
      networkFees: [],
      languages: [],
      selectedLanguage: null,
      selectedCurrency: null,
      selectedNetwork: null,
      selectedNetworkFee: 0,
    };
  },

  methods: {
    toggleGasFracture() {
      this.$services.settings.toggleGasFracture();
    },
  },

  watch: {
    selectedCurrency(currency) {
      this.$services.settings.setCurrency(currency);
      this.$store.dispatch('fetchHoldings');
    },

    selectedNetwork(network) {
      if (network.net === _.get(this.$store.state.currentNetwork, 'net')) {
        return;
      }

      network.fee = this.selectedNetworkFee;
      this.$services.network.setSelectedNetwork(network);
      this.$store.commit('handleNetworkChange');
      // For fast response
      this.$store.dispatch('fetchHoldings');
      this.$store.dispatch('fetchLatestVersion');
    },

    selectedNetworkFee(fee) {
      this.selectedNetwork.fee = fee;
      this.$services.network.setSelectedNetwork(this.selectedNetwork);
      this.$store.commit('handleNetworkChange');
      this.$services.neo.promptGASFractureIfNecessary();
    },

    selectedLanguage(language) {
      this.$i18n.locale = language;
      localStorage.setItem('language', language);
    },
  },

  computed: {
    shouldDisableNetworkSelection() {
      return this.$services.dex.isSystemAssetWithdrawInProgress();
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
      display: flex;
      flex-direction: row;

      .column {
        flex: 1;
        margin-right: $space;

        &.fracture-gas {
          align-items: center;
          cursor: pointer;
          display: flex;
          flex-direction: row;
          justify-content: center;

          > label {
            cursor: pointer;
            font-family: GilroySemibold;
            font-size: toRem(16px);
            margin-left: $space;
          }

          > .aph-icon {
            svg {
              height: toRem(20px);
            }

            .fill {
              fill: $dark-grey;
            }
          }
        }

        &:last-child {
          margin-right: 0;
        }
      }

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
