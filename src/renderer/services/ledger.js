import LedgerNode from '@ledgerhq/hw-transport-node-hid';
import alerts from './alerts';


export default {
  open() {
    return new Promise((resolve, reject) => {
      try {
        return LedgerNode.isSupported()
          .then((supported) => {
            if (!supported) {
              return reject('Your computer does not support the ledger!');
            }

            return LedgerNode.list()
              .then((paths) => {
                console.log(paths);

                if (paths.length === 0) {
                  return reject('USB Error: No device found.');
                }

                const path = paths[0];

                const device = LedgerNode.open(path);
                console.log(device);

                return resolve(device);
              })
              .catch((e) => {
                return reject(e);
              });
          })
          .catch((e) => {
            alerts.exception(e);
            return reject(e);
          });
      } catch (e) {
        console.log(e);
        return reject(e);
      }
    });
  },

  getDeviceInfo() {
    try {
      return this.open().device.getDeviceInfo();
    } catch (e) {
      console.log(e);
      return null;
    }
  },

};
