import LedgerNode from '@ledgerhq/hw-transport-node-hid';
import alerts from './alerts';


export default {
  open() {
    const callingFile = 'HID.node';
    let fileName = '';
    const origPST = Error.prepareStackTrace;
    const origSTL = Error.stackTraceLimit;
    const dummy = {};

    Error.stackTraceLimit = 10;

    Error.prepareStackTrace = function (e, st) {
      console.log(e);
      console.log(st);

      for (let i = 0, l = st.length; i < l; i += 1) {
        fileName = st[i].getFileName();
        console.log(`${fileName} ${st[i].getFunction()}`);
        if (fileName !== __filename) {
          if (callingFile) {
            if (fileName !== callingFile) {
              console.log('b1');
              // break;
            }
          } else {
            console.log('b2');
            // break;
          }
        }
      }
    };

    // run the 'prepareStackTrace' function above
    Error.captureStackTrace(dummy);

    // cleanup
    Error.prepareStackTrace = origPST;
    Error.stackTraceLimit = origSTL;
    console.log(fileName);

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
