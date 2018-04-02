<template>
  <div id="price">
    <div class="header">
      <h1 class="underlined">Price</h1>
      <div class="current-value">
        <div class="label">{{ $formatDate(date) }}</div>
        <div class="amount">{{ $store.state.statsToken.symbol }} {{ $formatMoney(current) }}</div>
      </div>
    </div>
    <div class="sub-header">
      <div class="volume">
        <div class="label">Volume</div>
        <div class="value">{{ $formatMoney(volume) }}</div>
      </div>
      <div class="low">
        <div class="label">Low</div>
        <div class="value">{{ $formatMoney(low) }}</div>
      </div>
      <div class="high">
        <div class="label">High</div>
        <div class="value">{{ $formatMoney(high) }}</div>
      </div>
    </div>
    <div class="body">
      <line-chart ref="chart" :chart-data="chartData" :options="chartOptions" v-if="chartOptions"></line-chart>
    </div>
  </div>
</template>

<script>
import LineChart from '../charts/LineChart';

export default {
  components: { LineChart },

  data() {
    return {
      date: null,
      chartData: null,
      chartOptions: null,
      high: 0,
      low: 0,
      volume: 0,
      current: 0,
    };
  },

  mounted() {
    this.loadPriceData();
    setInterval(() => {
      this.loadPriceData();
    }, 60000);

    this.$store.watch(
      () => {
        return this.$store.state.statsToken;
      }, () => {
        this.loadPriceData();
      });
  },

  methods: {
    loadPriceData() {
      if (!this.$store.state.statsToken) {
        return;
      }

      this.$services.valuation.getHistorical(this.$store.state.statsToken.symbol, 24 * 30, 10)
        .then((priceData) => {
          console.log(priceData);

          this.date = new Date();
          this.current = priceData.last;
          this.high = priceData.high;
          this.low = priceData.low;
          this.volume = priceData.volume;
          this.chartOptions = null;

          this.chartOptions = {
            legend: {
              display: false,
            },
            maintainAspectRatio: false,
            padding: {
              top: 50,
            },
            responsive: true,
            scales: {
              yAxes: [
                {
                  gridLines: {
                    display: false,
                    drawBorder: false,
                    tickMarkLength: 40,
                  },
                  margins: {
                    right: 100,
                    top: 100,
                  },
                  ticks: {
                    callback(label, index) {
                      return index % 2 === 0 ? window.accounting.formatMoney(label) : '';
                    },
                    autoSkip: true,
                    fontColor: '#19193A',
                    fontFamily: 'GilroySemibold',
                    fontSize: 12,
                    max: this.high,
                    maxTicksLimit: 5,
                    min: this.low,
                  },
                },
              ],
              xAxes: [
                {
                  gridLines: {
                    display: false,
                    drawBorder: false,
                    tickMarkLength: 20,
                  },
                  ticks: {
                    fontColor: '#B5B5CA',
                    fontFamily: 'GilroySemibold',
                    fontSize: 12,
                  },
                },
              ],
            },
          };

          this.chartData = {
            labels: priceData.dates,
            datasets: [
              {
                backgroundColor: 'transparent',
                borderColor: '#742BF0',
                data: priceData.prices,
                pointRadius: 0,
              },
            ],
          };

          this.$refs.chart.render();
        })
        .catch((e) => {
          console.log(e);
        });
    },
  },
};
</script>

<style lang="scss">
#price {
  @extend %tile-light;

  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    flex: none;
    padding: $space;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }

    .current-value {
      flex: none;
      text-align: right;

      .amount {
        color: $purple;
        font-family: GilroyMedium;
      }
    }
  }

  .sub-header {
    display: flex;
    flex: none;
    justify-content: flex-end;
    padding: $space;

    > div {
      align-items: center;
      display: flex;

      & + div {
        margin-left: $space-lg;
      }
    }

    .label {
      margin: 0 $space-xsm 0 0;
    }

    .value {
      font-family: GilroySemibold;
      font-size: toRem(12px);
    }
  }

  .body {
    flex: 1;
    min-height: 0;
    padding: $space;

    > div {
      height: 100%;
    }
  }

  .footer {
    display: flex;

    .option {
      border-bottom: 3px solid transparent;
      color: $purple;
      cursor: pointer;
      flex: 1;
      font-family: GilroyMedium;
      font-size: toRem(14px);
      padding: $space-sm 0;
      text-align: center;

      &:hover, &.active {
        border-color: $purple;
      }
    }
  }

  .label {
    @extend %small-uppercase-grey-label;

    margin-bottom: $space-sm;
  }
}
</style>

