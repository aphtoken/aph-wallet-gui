import moment from 'moment';
import { formats } from '../constants';
import alerts from './alerts';
import settings from './settings';

const CMC_BASE_URL = 'https://api.coinmarketcap.com/v1/';

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

  data[`market_cap_${lowercaseCurrency}`] = 0;
  data[`price_${lowercaseCurrency}`] = 0;

  return data;
};

export default {

  getValuation(symbol) {
    return new Promise((resolve, reject) => {
      try {
        // TODO handle currencies
        return axios.get(`${CMC_BASE_URL}ticker/${symbol}/?convert=${settings.getCurrency()}`)
          .then((res) => {
            resolve(res.data[0]);
          })
          .catch(() => {
            resolve(defaultValuation(symbol));
          });
      } catch (e) {
        return reject(e);
      }
    });
  },

  getHistorical(symbol, hoursBack, points) {
    return new Promise((resolve, reject) => {
      try {
        return axios.get(`https://min-api.cryptocompare.com/data/histohour?fsym=${symbol}&tsym=${settings.getCurrency()}&limit=${hoursBack}&aggregate=1&e=CCCAGG`)
          .then((res) => {
            console.log(res);
            const mod = Math.round(res.data.Data.length / points);
            let i = 0;
            const returnData = {
              high: 0,
              low: 999999999,
              volume: 0,
              last: 0,
              dates: [],
              prices: [],
            };
            res.data.Data.forEach((d) => {
              if (i % mod === 0) {
                console.log(d);
                returnData.dates.push(moment(d.time, 'X').format(formats.DATE_SHORT));
                returnData.prices.push(d.close);
              }

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
