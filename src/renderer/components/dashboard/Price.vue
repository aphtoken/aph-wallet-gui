<template>
  <section id="dashboard--price" v-if="$store.state.statsToken">
    <div class="header">
      <h1 class="underlined">{{$t('price')}}</h1>
      <div class="current-value">
        <div class="label">{{ $formatDate(date) }}</div>
        <div class="amount">{{ $store.state.statsToken.symbol }} {{ $formatMoney($store.state.statsToken.unitValue) }}</div>
      </div>
    </div>
    <div class="sub-header">
      <div class="volume">
        <div class="label">{{$t('volume')}}</div>
        <div class="value">{{ $formatMoneyWithoutCents(volume) }}</div>
      </div>
      <div class="low">
        <div class="label">{{$t('low')}}</div>
        <div class="value">{{ $formatMoney(low > $store.state.statsToken.unitValue ? $store.state.statsToken.unitValue : low) }}</div>
      </div>
      <div class="high">
        <div class="label">{{$t('high')}}</div>
        <div class="value">{{ $formatMoney(high < $store.state.statsToken.unitValue ? $store.state.statsToken.unitValue : high) }}</div>
      </div>
    </div>
    <div class="body">
      <line-chart ref="chart" :chart-data="chartData" :options="chartOptions" v-if="chartOptions"></line-chart>
    </div>
    <div class="footer">
      <div @click="changeTimeframe('D')" :class="['option', {active: timeframeOption === 'D'}]">{{$t('shortDayLabel')}}</div>
      <div @click="changeTimeframe('W')" :class="['option', {active: timeframeOption === 'W'}]">{{$t('shortWeekLabel')}}</div>
      <div @click="changeTimeframe('M')" :class="['option', {active: timeframeOption === 'M'}]">{{$t('shortMonthLabel')}}</div>
      <div @click="changeTimeframe('3M')" :class="['option', {active: timeframeOption === '3M'}]">{{$t('short3MonthLabel')}}</div>
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

    changeTimeframe(timeframe) {
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

  .header {
    display: flex;
    flex: none;
    padding: $space-lg;

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
        font-size: toRem(20px);
      }
    }
  }

  .sub-header {
    display: flex;
    flex: none;
    justify-content: flex-end;
    padding: 0 $space-lg;

    > div {
      align-items: center;
      display: flex;

      & + div {
        margin-left: $space-lg;
      }
    }

    .label {
      margin: 0 $space-xs 0 0;
    }

    .value {
      font-family: GilroySemibold;
      font-size: toRem(12px);
    }
  }

  .body {
    flex: 1;
    min-height: 0;
    padding: $space-lg;

    > div {
      height: 100%;
    }
  }

  .footer {
    display: flex;
    justify-content: space-around;

    .option {
      border-bottom: $border-width-thick solid transparent;
      color: $purple;
      cursor: pointer;
      flex: none;
      font-family: GilroyMedium;
      font-size: toRem(14px);
      padding: $space-sm $space-lg;
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

