const fiatCurrency = 'USD'; // todo, pull from app settings
const cmcBaseUrl = 'https://api.coinmarketcap.com/v1/';

export default {

  getValuation(symbol) {
    return new Promise((resolve, reject) => {
      try {
        return axios.get(`${cmcBaseUrl}ticker/${symbol}/?convert${fiatCurrency}`)
          .then((res) => {
            resolve(res.data[0]);
          })
          .catch(() => {
            resolve({
              available_supply: 0,
              id: symbol,
              last_updated: 0,
              market_cap_usd: 0,
              max_supply: 0,
              name: symbol,
              percent_change_1h: 0,
              percent_change_7d: 0,
              percent_change_24h: 0,
              price_btc: 0,
              price_usd: 0,
              rank: 0,
              symbol,
              total_supply: 0,
            });
          });
      } catch (e) {
        return reject(e);
      }
    });
  },

};
