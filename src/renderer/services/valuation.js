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
            resolve(0);
          });
      } catch (e) {
        return reject(e);
      }
    });
  },

};
