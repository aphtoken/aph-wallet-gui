<template>
  <section id="dashboard--price" v-if="$store.state.statsToken">
    <div class="timeframes">
      <div class="timeframe">
        <aph-radio @click="toggleTimeframe('D')" :selected="timeframeOption == 'D'"></aph-radio>
        <div class="label">{{$t('shortDayLabel')}}</div>
      </div>
      <div class="timeframe">
        <aph-radio @click="toggleTimeframe('W')" :selected="timeframeOption == 'W'"></aph-radio>
        <div class="label">{{$t('shortWeekLabel')}}</div>
      </div>
      <div class="timeframe">
        <aph-radio @click="toggleTimeframe('M')" :selected="timeframeOption == 'M'"></aph-radio>
        <div class="label">{{$t('shortMonthLabel')}}</div>
      </div>
      <div class="timeframe">
        <aph-radio @click="toggleTimeframe('3M')" :selected="timeframeOption == '3M'"></aph-radio>
        <div class="label">{{$t('short3MonthLabel')}}</div>
      </div>
      <div class="timeframe">
        <aph-radio @click="toggleTimeframe('Y')" :selected="timeframeOption == 'Y'"></aph-radio>
        <div class="label">{{$t('shortYearLabel')}}</div>
      </div>
    </div>
    <div class="body">
      <line-chart ref="chart" :chart-data="chartData" :options="chartOptions" v-if="chartOptions"></line-chart>
    </div>
  </section>
</template>

<script>
import moment from 'moment';
import LineChart from '../charts/LineChart';
let loadPriceDataIntervalId;
let storeUnwatch;

export default {
  components: { LineChart },

  data() {
    return {
      symbol: '',
      timeframeOption: 'M',
      timeframeHours: 24 * 30,
      date: null,
      chartData: null,
      chartOptions: null,
      high: 0,
      low: 0,
      volume: 0,
      current: 0,
      isChartDataAvailable: false,
    };
  },

  computed: {
    reloadInterval() {
      return this.timeframeHours <= 24 ? (15 * 60 * 1000) : (30 * 60 * 1000);
    },
  },

  mounted() {
    this.setReloadInterval();

    storeUnwatch = this.$store.watch(
      () => {
        return this.$store.state.statsToken;
      }, () => {
        if (this.$store.state.statsToken
          && this.$store.state.statsToken.symbol !== this.symbol) {
          this.loadPriceData();
        }
      });
  },

  beforeDestroy() {
    clearInterval(loadPriceDataIntervalId);
    storeUnwatch();
  },

  methods: {
    setReloadInterval() {
      if (loadPriceDataIntervalId) {
        clearInterval(loadPriceDataIntervalId);
      }

      this.loadPriceData();
      loadPriceDataIntervalId = setInterval(() => {
        this.loadPriceData();
      }, this.reloadInterval);
    },

    toggleTimeframe(timeframe) {
      this.timeframeOption = timeframe;

      switch (this.timeframeOption) {
        case 'D':
          this.timeframeHours = 24;
          break;
        case 'W':
          this.timeframeHours = 7 * 24;
          break;
        case 'M': default:
          this.timeframeHours = 30 * 24;
          break;
        case '3M':
          this.timeframeHours = 3 * 30 * 24;
          break;
        case 'Y':
          this.timeframeHours = 12 * 30 * 24;
          break;
      }

      this.setReloadInterval();
    },

    loadPriceData() {
      const _this = this;

      if (!this.$store.state.statsToken) {
        return;
      }

      this.symbol = this.$store.state.statsToken.symbol;

      // eslint-disable-next-line
      this.$services.valuation.getHistorical(this.$store.state.statsToken.symbol, this.timeframeHours)
        .then((priceData) => {
          this.date = moment().unix();
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
                      return index % 2 === 0 ? _this.$formatMoney(label) : '';
                    },
                    autoSkip: true,
                    fontColor: '#66688D',
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
                    callback(label) {
                      switch (_this.timeframeOption) {
                        case 'D':
                          return _this.$formatTime(label);
                        case 'W':
                          return _this.$formatWeekdayAndTime(label);
                        case 'M':
                          return _this.$formatDateShort(label);
                        case '3M':
                          return _this.$formatDateShort(label);
                        default: return _this.$formatDateShort(label);
                      }
                    },
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

          if (priceData.dates.length > 0 && this.$refs.chart) {
            this.$refs.chart.render();
          }
        })
        .catch((e) => {
          this.$services.alert.exception(e);
        });
    },
  },
};
</script>

<style lang="scss">
#dashboard--price {
  @extend %tile-light;

  display: flex;
  flex-direction: column;
  margin: $space;

  .timeframes {
    padding: $space-lg;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .timeframe {
      display: flex;
      align-items: center;

      .label {
        font-weight: bold;
        margin-left: $space;
      }
    }
  }

  .body {
    flex: 1;
    min-height: 0;
    padding: $space-lg;

    > div {
      height: toRem(300px);
    }
  }
}
</style>
