/* **************************************************************************************
 * Documentation About etherscan api is available at follwing link:
 * https://etherscan.io/apis
 *
 ************************************************************************************** */
import alerts from './alerts';

export default {
  getLast50TxByAddress(uri, address) {
    return new Promise((resolve, reject) => {
      try {
        return axios.get(`${uri}&module=account&action=txlist&address=${address}`
          + '&startblock=0&endblock=99999999&page=1&offset=50&sort=desc')
          .then((res) => {
            resolve(res.data.result);
          }).catch((e) => {
            alerts.exception(e);
            resolve([]);
          });
      } catch (e) {
        alerts.exception(e);
        return reject(e);
      }
    });
  },

  getLast50TokenTxByAddress(uri, address) {
    return new Promise((resolve, reject) => {
      try {
        return axios.get(`${uri}&module=account&action=tokentx&address=${address}`
          + '&startblock=0&endblock=99999999&page=1&offset=50&sort=desc')
          .then((res) => {
            resolve(res.data.result);
          }).catch((e) => {
            alerts.exception(e);
            resolve([]);
          });
      } catch (e) {
        alerts.exception(e);
        return reject(e);
      }
    });
  },

  getAbiByAddress(uri, address) {
    return new Promise((resolve, reject) => {
      try {
        return axios.get(`${uri}&module=contract&action=getabi&address=${address}`)
          .then((res) => {
            if (res.data.status === '0') {
              resolve([]);
            } else {
              resolve(res.data.result);
            }
          }).catch((e) => {
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
