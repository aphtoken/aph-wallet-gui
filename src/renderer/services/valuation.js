import moment from 'moment';

import alerts from './alerts';
import settings from './settings';

const CMC_BASE_URL = 'https://api.coinmarketcap.com/v1/';
const DEFAULT_APH_TOTAL_SUPPLY = 70000000;

let coinTickerList = [];
let prices = {};
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
  getValuations(symbols) {
    return new Promise(async (resolve, reject) => {
      const currency = settings.getCurrency();
      if (!lastCheckedTicker || moment.utc().diff(lastCheckedTicker, 'seconds') >= 120) {
        try {
          const res = await axios.get(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols.join(',')}`
            + `&tsyms=${currency}`);

          const rawPrices = res.data.RAW;
          const priceInfo = {};
          Object.keys(rawPrices).forEach((symbol) => {
            const data = rawPrices[symbol][currency];
            priceInfo[symbol] = {
              available_supply: data.SUPPLY,
              id: symbol,
              last_updated: data.LASTUPDATE,
              max_supply: symbol === 'APH' ? DEFAULT_APH_TOTAL_SUPPLY : 0,
              name: symbol,
              percent_change_1h: 0,
              percent_change_7d: 0,
              percent_change_24h: data.CHANGEPCT24HOUR,
              [`price_${currency.toLowerCase()}`]: data.PRICE,
              [`market_cap_${currency.toLowerCase()}`]: data.MKTCAP,
              price_btc: 0,
              rank: 0,
              symbol,
              total_supply: symbol === 'APH' ? DEFAULT_APH_TOTAL_SUPPLY : 0,
            };
          });
          prices = priceInfo;
          resolve(prices);
        } catch (e) {
          reject(e);
        }
        return;
      }
      resolve(prices);
    });
  },

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
            if (!Array.isArray(res.data.Data) || res.data.Data.length === 0) {
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
            res.data.Data.forEach((value) => {
              returnData.dates.push(value.time);
              returnData.prices.push(value.close);

              if (value.high > returnData.high) {
                returnData.high = value.high;
              }
              if (value.low < returnData.low) {
                returnData.low = value.low;
              }
              returnData.volume += value.volumeto;
              if (i === res.data.Data.length - 1) {
                returnData.last = value.close;
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
