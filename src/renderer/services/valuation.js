import moment from 'moment';

import alerts from './alerts';
import settings from './settings';

const CMC_BASE_URL = 'https://api.coinmarketcap.com/v1/';
const DEFAULT_APH_TOTAL_SUPPLY = 70000000;

let coinTickerList = [];
let lastCheckedTicker = null;

const defaultValuation = (symbol) => {
  const lowercaseCurrency = settings.getCurrency().toLowerCase();

  const data = {
    available_supply: 0,
    id: symbol,
    last_updated: 0,
    max_supply: 0,
    name: symbol,
    percent_change_1h: 0,
    percent_change_7d: 0,
    percent_change_24h: 0,
    price_btc: 0,
    rank: 0,
    symbol,
    total_supply: 0,
  };

  data[`market_cap_${lowercaseCurrency}`] = null;
  data[`price_${lowercaseCurrency}`] = null;

  return data;
};

export default {

  getValuation(symbol) {
    return new Promise((resolve, reject) => {
      try {
        if (!lastCheckedTicker || moment.utc().diff(lastCheckedTicker, 'seconds') >= 60) {
          axios.get(`${CMC_BASE_URL}ticker/?limit=1000&convert=${settings.getCurrency()}`)
            .then((res) => {
              lastCheckedTicker = moment.utc();
              coinTickerList = _.values(res.data);
              resolve(_.find(coinTickerList, { symbol }));
            });
          return;
        }

        let valuation = _.find(coinTickerList, { symbol });

        if (!valuation) {
          valuation = defaultValuation(symbol);
          if (symbol === 'APH') {
            valuation.total_supply = DEFAULT_APH_TOTAL_SUPPLY;
          }
        }
        resolve(valuation);
      } catch (e) {
        reject(e);
      }
    });
  },

  getHistorical(symbol, hoursBack) {
    /* eslint-disable max-len */
    const uri = `https://min-api.cryptocompare.com/data/histohour?fsym=${symbol}&tsym=${settings.getCurrency()}&limit=${hoursBack}&aggregate=1&e=CCCAGG`;
    /* eslint-enable max-len */

    return new Promise((resolve, reject) => {
      try {
        return axios.get(uri)
          .then((res) => {
            let i = 0;
            const returnData = {
              high: 0,
              low: 999999999,
              volume: 0,
              last: 0,
              dates: [],
              prices: [],
            };
            if (res.data.Data.length === 0) {
              resolve({
                high: null,
                low: null,
                volume: null,
                last: null,
                dates: [],
                prices: [],
              });
              return;
            }
            res.data.Data.forEach((d) => {
              returnData.dates.push(d.time);
              returnData.prices.push(d.close);

              if (d.high > returnData.high) {
                returnData.high = d.high;
              }
              if (d.low < returnData.low) {
                returnData.low = d.low;
              }
              returnData.volume += d.volumeto;
              if (i === res.data.Data.length - 1) {
                returnData.last = d.close;
              }
              i += 1;
            });
            resolve(returnData);
          })
          .catch((e) => {
            alerts.exception(e);
            resolve([]);
          });
      } catch (e) {
        alerts.exception(e);
        return reject(e);
      }
    });
  },

};
