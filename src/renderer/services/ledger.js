import {
  tx,
  u,
  wallet,
} from '@cityofzion/neon-js';
import LedgerNode from '@ledgerhq/hw-transport-node-hid';
import { store } from '../store';
import wallets from './wallets';

const VALID_STATUS = 0x9000;
let currentDevice = null;
let currentLedger = null;

export default {
  assembleSignature(response) {
    const ss = new u.StringStream(response);

    // The first byte is format. It is usually 0x30 (SEQ) or 0x31 (SET)
    // The second byte represents the total length of the DER module.
    ss.read(2);
    // Now we read each field off
    // Each field is encoded with a type byte, length byte followed by the data itself
    ss.read(1); // Read and drop the type
    const r = ss.readVarBytes();

    ss.read(1);
    const s = ss.readVarBytes();

    // We will need to ensure both integers are 32 bytes long
    const integers = [r, s].map((i) => {
      if (i.length < 64) {
        i = i.padStart(64, '0');
      }

      if (i.length > 64) {
        i = i.substr(-64);
      }

      return i;
    });

    return integers.join('');
  },

  bip44(acct) {
    const acctNumber = acct.toString(16);

    return `8000002C800003788000000000000000${'0'.repeat(8 - acctNumber.length)}${acctNumber}`;
  },

  close() {
    return new Promise((resolve, reject) => {
      store.commit('setShowSendWithLedgerModal', false);
      store.commit('setShowSendRequestLedgerSignature', false);

      if (!currentDevice) {
        currentDevice = null;
        resolve();

        return;
      }

      currentDevice.close()
        .then(() => {
          currentDevice = null;
          resolve();
        })
        .catch((e) => {
          console.log(e);

          return reject(e);
        });
    });
  },

  getDeviceInfo() {
    try {
      const deviceInfo = currentDevice.device.getDeviceInfo();

      return deviceInfo;
    } catch (e) {
      console.log(e);

      return null;
    }
  },

  getPublicKey() {
    return new Promise((resolve, reject) => {
      try {
        return this.send('80040000', this.bip44(0), [VALID_STATUS])
          .then((res) => {
            const key = res.toString('hex').substring(0, 130);

            resolve(key);
          })
          .catch((e) => {
            return reject(e);
          });
      } catch (e) {
        console.log(e);

        return reject(e);
      }
    });
  },

  getSignature(data, acct) {
    return new Promise((resolve, reject) => {
      try {
        data += this.bip44(acct);
        const chunks = data.match(/.{1,510}/g) || [];

        if (!chunks.length) {
          reject(`Invalid data provided: ${data}`);

          return;
        }

        this.sendChunk(0, chunks)
          .then((res) => {
            if (res === 0x9000) {
              reject('No more data but Ledger did not return signature!');

              return;
            }

            resolve(this.assembleSignature(res.toString('hex')));
          })
          .catch((e) => {
            return reject(e);
          });
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });
  },

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
                if (paths.length === 0) {
                  return reject('No Ledger device found. Please plugin your Ledger in, '
                    + 'unlock it and open the NEO application.');
                }

                const path = paths[0];

                return LedgerNode.open(path)
                  .then((res) => {
                    currentDevice = res;
                    this.getPublicKey()
                      .then(() => {
                        currentLedger = this;
                        resolve(currentDevice);
                      })
                      .catch(() => {
                        return reject('Please plugin your Ledger in, '
                          + 'unlock it and open the NEO application.');
                      });
                  })
                  .catch(({ message }) => {
                    return reject(message);
                  });
              })
              .catch(({ message }) => {
                return reject(message);
              });
          })
          .catch(({ message }) => {
            return reject(message);
          });
      } catch ({ message }) {
        return reject(message);
      }
    });
  },

  send(params, msg, statusList) {
    if (params.length !== 8) {
      throw new Error('params requires 4 bytes');
    }

    const [cla, ins, p1, p2] = params.match(/.{1,2}/g).map(i => parseInt(i, 16));

    return currentDevice.send(cla, ins, p1, p2, Buffer.from(msg, 'hex'), statusList);
  },

  sendChunk(i, chunks) {
    return new Promise((resolve, reject) => {
      try {
        const p = i === chunks.length - 1 ? '80' : '00';
        const chunk = chunks[i];
        const params = `8002${p}00`;

        this.send(params, chunk, [VALID_STATUS])
          .then((res) => {
            i += 1;
            if (i < chunks.length) {
              this.sendChunk(i, chunks)
                .then((resInner) => {
                  resolve(resInner);
                })
                .catch((e) => {
                  reject(e);
                });
            } else {
              resolve(res);
            }
          })
          .catch((e) => {
            reject(e);
          });
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });
  },

  signWithLedger(unsignedTx) {
    return new Promise((resolve, reject) => {
      try {
        const currentWallet = wallets.getCurrentWallet();

        if (currentWallet.isLedger !== true) {
          reject('Current wallet is not a ledger wallet.');

          return;
        }

        store.commit('setShowSendWithLedgerModal', true);
        currentLedger.open()
          .then(() => {
            const data = tx.serializeTransaction(unsignedTx, false);

            store.commit('setShowSendRequestLedgerSignature', true);
            currentLedger.getSignature(data, 0)
              .then((sig) => {
                const invocationScript = `40${sig}`;
                const verificationScript = wallet.getVerificationScriptFromPublicKey(currentWallet.publicKeyEncoded);
                const txObj = tx.deserializeTransaction(data);

                txObj.scripts.push({ invocationScript, verificationScript });
                const serialized = tx.serializeTransaction(txObj);

                resolve(serialized);
                currentLedger.close();
              })
              .catch((e) => {
                currentLedger.close();
                reject(e);
              });
          })
          .catch((e) => {
            currentLedger.close();
            reject(e);
          });
      } catch (e) {
        currentLedger.close();
        reject(e);
      }
    });
  },
};
