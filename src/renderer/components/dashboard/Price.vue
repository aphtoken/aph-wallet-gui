<template>
  <div class="price">
    <div class="header">
      <h1 class="underlined">Price</h1>
      <div class="current-value">
        <div class="label">Tue Mar 20</div>
        <div class="amount">$1.43</div>
      </div>
    </div>
    <div class="sub-header">
      <div class="volume">
        <div class="label">Volume</div>
        <div class="value">$1,542,207</div>
      </div>
      <div class="low">
        <div class="label">Low</div>
        <div class="value">$1.12</div>
      </div>
      <div class="high">
        <div class="label">High</div>
        <div class="value">$1.35</div>
      </div>
    </div>
    <div class="body">
      <line-chart :chart-data="chartData" :options="chartOptions"></line-chart>
    </div>
    <div class="footer">
      <div class="option">H</div>
      <div class="option">D</div>
      <div class="option active">W</div>
      <div class="option">M</div>
      <div class="option">6M</div>
      <div class="option">Y</div>
    </div>
  </div>
</template>

<script>
import LineChart from '../charts/LineChart';

export default {
  components: { LineChart },

  computed: {
    chartData() {
      return {
        labels: ['20-01', '21-01', '22-01', '23-01', '24-01', '25-01'],
        datasets: [
          {
            backgroundColor: 'transparent',
            borderColor: '#742BF0',
            data: [1.12, 1.34, 1.35, 1.13, 1.2, 1.32],
            pointRadius: 0,
          },
        ],
      };
    },

    chartOptions() {
      return {
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
                fontFamily: 'GilroySemiBold',
                max: 1.5,
                maxTicksLimit: 5,
                min: 1,
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
                fontFamily: 'GilroySemiBold',
              },
            },
          ],
        },
      };
    },
  },
};
</script>

<style lang="scss">
.price {
  background: white;
  border-radius: $border-radius;
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
      font-family: GilroySemiBold;
      font-size: $space * .6;
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
      font-size: $font-size-sm;
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

