<template>
  <section id="dex--chart">
    <div class="header tab">
      <h1 :class="[{selected: tab === 'Chart'}]" @click="selectTab('Chart')">{{$t('candlesticks')}}</h1>
      <h1 :class="[{selected: tab === 'Depth'}]" @click="selectTab('Depth')">{{$t('depth')}}</h1>
    </div>
    <div class="body" v-if="isTradingDisabled">
      <p v-if="isOutOfDate">
        {{$t('outOfDateMessage')}}
      </p>
      <p v-if="isMarketClosed">
        {{$t('marketClosedMessage')}}
      </p>
    </div>
    <div class="body" v-else>
      <div id="chart-container" :class="[{visible: tab === 'Chart'}]">
      </div>
      <div id="depth-container" :class="[{visible: tab === 'Depth'}]">
        <div class="upper">
          <div class="left-axis">
            <div class="value">100</div>
            <div class="value">80</div>
            <div class="value">60</div>
            <div class="value">40</div>
            <div class="value">20</div>
            <div class="value">0</div>
            </div>
          <div class="panel">
            <div class="bids" v-if="$store.state.orderBook">
              <div class="level" v-for="(bid, index) in bidGroups" :key="index">
                  <div class="size-bar" :style="{ height: (bid.quantityRatio * 100) + '%' }">
                       <span>{{ $formatNumber(bid.runningQuantity) }}</span>
                  </div>
              </div>
            </div>
            <div class="asks" v-if="$store.state.orderBook">
              <div class="level" v-for="(ask, index) in askGroups" :key="index">
                  <div class="size-bar" :style="{ height: (ask.quantityRatio * 100) + '%' }">
                       <span>{{ $formatNumber(ask.runningQuantity) }}</span>
                  </div>
              </div>
            </div>
          </div>
          <div class="right-axis">
            <div class="value">100</div>
            <div class="value">80</div>
            <div class="value">60</div>
            <div class="value">40</div>
            <div class="value">20</div>
            <div class="value">0</div>
          </div>
        </div>
        <div class="bottom-axis">
          <div class="bids" v-if="$store.state.orderBook">
            <div class="level" v-for="(bid, index) in bidGroups" :key="index">
              <span>{{ bid.priceLabel }}</span>
            </div>
          </div>
          <div class="asks" v-if="$store.state.orderBook">
            <div class="level" v-for="(ask, index) in askGroups" :key="index">
              <span>{{ ask.priceLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
import { BigNumber } from 'bignumber.js';

export default {
  data() {
    return {
      tab: 'Chart',
      styleMode: 'Night',
      depthPrecision: 4,
      lastPrice: 0,
      barsSubscription: null,
      tradingView: null,
      tradeHistoryUnwatch: null,
      storeUnwatch: null,
    };
  },

  mounted() {
    this.tradeHistoryUnwatch = this.$store.watch(
      () => {
        return this.$store.state.tradeHistory;
      }, (val, oldValue) => {
        if (!oldValue || val.marketName !== oldValue.marketName) {
          this.loadChart();
        }
      });

    this.styleMode = this.$store.state.styleMode;
    this.storeUnwatch = this.$store.watch(
      () => {
        return this.$store.state.styleMode;
      }, () => {
        if (this.styleMode !== this.$store.state.styleMode) {
          this.loadChart();
        }
        this.styleMode = this.$store.state.styleMode;
      });
    this.loadChart();
  },

  beforeDestroy() {
    this.storeUnwatch();
    this.tradeHistoryUnwatch();
    clearInterval(this.barsSubscription);
  },

  methods: {
    selectTab(tab) {
      this.tab = tab;
      if (tab === 'Chart') {
        this.loadChart();
      } else {
        this.removeChart();
      }
    },

    removeChart() {
      const container = document.getElementById('chart-container');
      while (container && container.hasChildNodes()) {
        container.removeChild(container.lastChild);
      }
      clearInterval(this.barsSubscription);
    },

    loadChart() {
      /* eslint-disable */
      try {
        const container = document.getElementById('chart-container');
        if (!container) {
          return;
        }

        if (!this.$store.state.currentMarket) {
          return;
        }

        this.removeChart();

        const symbolName = this.$store.state.currentMarket.marketName;
        const tradedExchange = 'Aphelion'
        const fullName = `${tradedExchange}:${symbolName}`
        const symbolInfo = {
          name: fullName,
          has_daily: false,
          has_weekly_and_monthly: false,
          has_intraday: true,
          intraday_multipliers: ['1'],
          has_no_volume: false,
          has_empty_bars: true,
          minmov: 1,
          pricescale: 100000000,
          minmov2: 0,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          session: '24x7',
          volume_precision: 5,
        }

        const datafeed = {
          onReady: (callback) => {
            setTimeout(() => {
              callback(
                {
                  exchanges: [],
                  symbolsTypes: [],
                  supports_search: false,
                  supports_group_request: false,
                  supports_marks: false,
                  supports_timescale_marks: false,
                  supports_time: false,
                  supported_resolutions: [1, 5, 15, 30, 60, 360, '1D', '3D'],
                },
              )
            }, 0)
          },

          searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
            onResultReadyCallback([])
          },

          resolveSymbol: (_symbolName, onSymbolResolvedCallback,
            onResolveErrorCallback) => {
            setTimeout(() => { onSymbolResolvedCallback(symbolInfo) }, 0)
          },

          getBars: (_symbolInfo, resolution, from, to, onDataCallback, onErrorCallback) => {
            const bars = this.$store.state.tradeHistory && this.$store.state.tradeHistory.getBars ?
              this.$store.state.tradeHistory.getBars(this.$store.state.tradeHistory, resolution, from, to, this.lastPrice) :
              [];

            if (bars.length === 0) {
              onDataCallback(bars, { noData: true })
            } else {
              this.lastPrice = bars[bars.length - 1].close;
              onDataCallback(bars, { noData: false })
            }
          },

          subscribeBars: (_symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
            let lastBarTime = NaN;
            if (this.barsSubscription) {
              clearInterval(this.barsSubscription);
            }

            this.barsSubscription = setInterval(() => {
              if (!this.tradingView || !this.tradingView._options) {
                return;
              }
              const to = Math.round(new Date().valueOf() / 1000);
              const from = to - 120;

              this.tradingView._options.datafeed.getBars(_symbolInfo, resolution, from, to, (bars) => {
                if (bars.length === 0) {
                  return;
                }

                const lastBar = bars[bars.length - 1];

                if (!Number.isNaN(lastBarTime) && lastBar.time < lastBarTime) {
                  return;
                }

                const isNewBar = !Number.isNaN(lastBarTime) && lastBar.time > lastBarTime

                if (isNewBar && bars.length >= 2) {
                  const previousBar = bars[bars.length - 2];
                  onRealtimeCallback(previousBar);
                }

                lastBarTime = lastBar.time;

                try {
                  onRealtimeCallback(lastBar);
                } catch (err) {
                  // This is a false positive due to using has_empty_bars
                  if (err.message.contains('time order violation')) {
                    return
                  }

                  throw err;
                }
              })
            }, 10000)
          },

          unsubscribeBars: (subscriberUID) => {
            clearInterval(this.barsSubscription);
          },
        }

        var settings = {
          // debug: true,
          fullscreen: false,
          symbol: symbolName,
          interval: '5',
          container_id: "chart-container",
          datafeed: datafeed,
          library_path: 'static/charting_library/',
          locale: "en",
          drawings_access: { type: 'black', tools: [ { name: this.$t('regressionTrend') } ] },
          disabled_features: [
            "use_localstorage_for_settings","header_symbol_search","header_interval_dialog_button","header_screenshot","header_undo_redo",
            "header_compare","symbol_info","display_market_status","display_market_status",
          ],
          enabled_features: [],
          autosize: true,
		    };

        if (this.$store.state.styleMode === 'Night') {
          settings.overrides = {
            "paneProperties.background": "#18152c",
            "paneProperties.vertGridProperties.color": "#454545",
            "paneProperties.horzGridProperties.color": "#454545",
            "symbolWatermarkProperties.transparency": 90,
            "scalesProperties.textColor": "#AAA",
            "scalesProperties.backgroundColor": "#18152c",
          };

          settings.toolbar_bg = '#18152c';

          setTimeout(() => {
            for (var i = 0; i < window.frames.length; i++) {
              if (window.frames[i].name === container.children[0].id) {
                window.frames[i].document.body.classList.add('Night');
                break;
              }
            }
          }, 1000);
        }

        setTimeout(() => {
          var cssLink = document.createElement("link");
          cssLink.href = "styles.css";
          cssLink.rel = "stylesheet";
          cssLink.type = "text/css";
          for (var i = 0; i < window.frames.length; i++) {
            if (window.frames[i].name === container.children[0].id) {
              window.frames[i].document.body.appendChild(cssLink);
              break;
            }
          }
        }, 1000);

        this.tradingView = new TradingView.widget(settings);
      } catch (e) {
        console.log(e);
        alert(e);
      }
    },

    roundToDepthPrecision(value) {
      return new BigNumber(Math.round(value * Math.pow(10, this.depthPrecision)) / Math.pow(10, this.depthPrecision));
    },
  },

  computed: {
    isTradingDisabled() {
      return this.isOutOfDate || this.isMarketClosed;
    },

    isOutOfDate() {
      return this.$store.state.latestVersion && this.$store.state.latestVersion.prodExchangeScriptHash
        && this.$store.state.latestVersion.prodExchangeScriptHash.replace('0x', '')
          !== this.$store.state.currentNetwork.dex_hash;
    },

    isMarketClosed() {
      return this.$store.state.currentMarket && this.$store.state.currentMarket.isOpen === false;
    },

    bidGroups() {
      try {
        const groups = [];
        const size = this.groupSize;
        let currentLower = this.middle.minus(size);

        while (groups.length < 5) {
          let currentGroup = {
            priceUpper: currentLower.plus(size),
            priceLower: currentLower,
            priceLabel: this.$formatNumber(currentLower),
            quantity: new BigNumber(0),
          };

          this.$store.state.orderBook.bids.forEach((l) => {
            if (l.price.isGreaterThan(currentGroup.priceLower) && l.price.isLessThanOrEqualTo(currentGroup.priceUpper)) {
              currentGroup.quantity = currentGroup.quantity.plus(l.quantity);
            }
          });
          groups.push(currentGroup);
          currentLower = this.roundToDepthPrecision(currentLower.minus(size));
        };

        let totalQuantity = new BigNumber(0);
        let runningQuantity = new BigNumber(0);
        groups.forEach((l) => {
          totalQuantity = totalQuantity.plus(l.quantity);
        });
        groups.forEach((l) => {
          l.runningQuantity = runningQuantity = runningQuantity.plus(l.quantity);
          l.quantityRatio = runningQuantity.dividedBy(totalQuantity);
        });

        return groups.reverse();
      } catch (e) {
        console.log(e);
        return [];
      }
    },
    askGroups() {
      try {
        const groups = [];
        const size = this.groupSize;
        let currentUpper = this.middle.plus(size);

        while (groups.length < 5) {
          let currentGroup = {
            priceUpper: currentUpper,
            priceLower: currentUpper.minus(size),
            priceLabel: this.$formatNumber(currentUpper),
            quantity: new BigNumber(0),
          };

          this.$store.state.orderBook.asks.forEach((l) => {
            if (l.price.isGreaterThanOrEqualTo(currentGroup.priceLower) && l.price.isLessThan(currentGroup.priceUpper)) {
              currentGroup.quantity = currentGroup.quantity.plus(l.quantity);
            }
          });

          groups.push(currentGroup);
          currentUpper = this.roundToDepthPrecision(currentUpper.plus(size));
        };

        let totalQuantity = new BigNumber(0);
        let runningQuantity = new BigNumber(0);
        groups.forEach((l) => {
          totalQuantity = totalQuantity.plus(l.quantity);
        });
        groups.forEach((l) => {
          l.runningQuantity = runningQuantity = runningQuantity.plus(l.quantity);
          l.quantityRatio = runningQuantity.dividedBy(totalQuantity);
        });

        return groups.reverse();
      } catch (e) {
        console.log(e);
        return [];
      }
    },
    middle() {
      const bids = this.$store.state.orderBook.bids;
      const asks = this.$store.state.orderBook.asks;
      if (bids.length > 0 && asks.length > 0) {
        return bids[0].price.plus(asks[0].price).dividedBy(2);
      } else if (bids.length > 0) {
        return bids[0].price;
      } else if (asks.length > 0)  {
        return asks[0].price;
      }
      return new BigNumber(0);
    },
    groupSize() {
      const bids = this.$store.state.orderBook.bids;
      const asks = this.$store.state.orderBook.asks;

      // TODO: Re-visit math used here for determining the groupSize.
      let bidRange = 0;
      if (bids.length > 1 && asks.length > 0) {
        bidRange = Math.abs(this.middle - bids[bids.length - 1].price);
      }

      let askRange = 0;
      if (asks.length > 1 && bids.length > 0) {
        askRange = Math.abs(asks[asks.length - 1].price - this.middle);
      }

      let groupSize = bidRange;
      if (askRange < bidRange) {
        groupSize = askRange;
      }

      this.depthPrecision = 4;
      while (groupSize * Math.pow(10, this.depthPrecision) < 1) {
        this.depthPrecision += 1;
      }

      groupSize = this.roundToDepthPrecision(groupSize).dividedBy(5);
      return groupSize;
    }
  },

};
</script>
<style lang="scss">
#dex--chart {
  @extend %tile-light;

  .header {
    padding: $space $space 0;

    h1 {
      @extend %underlined-header-sm;
    }

    &.tab {
      position: relative;
      display: flex;
      justify-content: flex-end;

      h1 {
        @extend %underlined-header-sm;

        cursor: pointer;
        margin-bottom: 0;

        & + h1 {
          margin-left: $space-lg;
        }

        &:not(.selected) {
          color: $grey;

          &:after {
            background: transparent;
          }
        }
      }
    }
  }

  .body {
    padding: $space;

    #chart-container, #depth-container {
      height: 500px;
      display: none;

      &.visible {
        display: block;
      }
    }

    #depth-container {
      padding-top: $space-lg;

      .upper {
        display: flex;
        height: 85%;

        .left-axis, .right-axis {
          width: toRem(75px);
          padding: 0 $space-sm;

          .value {
            height: 19%;
          }
        }
        .left-axis {
          text-align: right;
        }
        .panel {
          flex: 1;
          display: flex;
          overflow: hidden;
          margin: -50px -50px 0px -50px;
          padding: 50px 50px 0px 50px;

          .bids, .asks {
            flex: 1;
            display: flex;

            .level {
              flex: 1;
              position: relative;

              .size-bar {
                width: 100%;
                position: absolute;
                bottom: 0px;

                span {
                  display: none;

                  @extend %light-background;
                  padding: $space-sm $space;
                  border: 1px solid $green;
                  border-radius: 4px;
                  position: absolute;
                  top: -45px;
                  left: -10px;
                  right: -10px;
                  text-align: center;

                  &:before {
                    content: "";
                    height: 500px;
                    width: 1px;
                    background-color: $grey;
                    display: block;
                    position: absolute;
                    top: 30px;
                    left: 48%;
                  }

                  &:after {
                    content: "\25CF";
                    height: 5px;
                    width: 100%;
                    color: $green;
                    display: block;
                    position: absolute;
                    top: 35px;
                    left: 0px;
                    right: 0px;
                  }
                }
                &:hover {
                  span {
                    display: block;
                  }
                }
              }
            }
          }

          .bids {
            .level {
              margin-left: -2px;
              .size-bar {
                background-color: $light-green;
                border-top: 2px solid $green;
                border-right: 2px solid $green;
              }
            }
          }

          .asks {
            flex-direction: row-reverse;
            border-left: 1px solid $dark-grey;

            .level {
              margin-right: -2px;
              .size-bar {
                background-color: $light-red;
                border-top: 2px solid $red;
                border-left: 2px solid $red;

                span {
                  border: 1px solid $red;

                  &:after {
                    color: $red;
                  }
                }
              }
            }
          }
        }
        .right-axis {
          text-align: left;
        }
      }
      .bottom-axis {
        display: flex;
        height: 15%;
        padding: $space-sm toRem(75px);

        .bids, .asks {
          flex: 1;
          display: flex;

          .level {
            flex: 1;

            span {
              transform: rotate(59deg) translateX(25px) translateY(0px);
              display: block;
            }
          }
        }

        .asks {
          flex-direction: row-reverse;
        }
      }
    }
  }
}
</style>


