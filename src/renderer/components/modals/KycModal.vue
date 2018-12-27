<template>
  <modal-wrapper id="aph-kyc-modal">
  <!-- <div class="aph-kyc-modal" id="aph-kyc-modal"> -->
    <div class="header">{{ getHeader() }}</div>
    <div id="frame-content" v-if="kycStatus === 'kycneeded'">
    </div>
    <body class="body" v-if="kycStatus !== 'kycneeded'" >
      <div v-if="kycStatus.startsWith('accepted')">
        <p>Your KYC Application was accepted. Please wait while your application
          is processed and your account has been whitelisted.</p>
        <p>To check again just dismiss this dialog and attempt a deposit again.</p>
      </div>
      <div v-if="kycStatus.startsWith('manualReview')">
        <p>Your KYC Application was received as of {{ reviewTime }}, but requires manual review,
          which may take up to a few days.</p>
        <p>To check again just dismiss this dialog and attempt a deposit again.</p>
      </div>
      <div v-if="kycStatus.startsWith('denied')">
        <p>Unfortunately your KYC Application was denied.</p>
        <p>You must wait an additional {{ deniedRemainingMinutes }} minutes in order to try again.</p>
      </div>
    </body>

    <button class="dismiss-btn" @click="close">Dismiss</button>
  <!-- </div> -->
  </modal-wrapper>
</template>

<script>
import ModalWrapper from './ModalWrapper';

export default {
  components: {
    ModalWrapper,
  },
  data() {
    return {
      title: 'Loading',
      kycStatus: 'kycneeded',
      reviewTime: '',
      deniedWaitingMinutes: '',
      deniedRemainingMinutes: '',
    };
  },

  async mounted() {
    const container = document.getElementById('frame-content');
    if (!container) {
      return;
    }
    const services = this.$services;
    // this.$store.state.kycInProgressModalModel.kycStatus = 'denied|100000|100000';
    // this.$store.state.kycInProgressModalModel.kycStatus = 'manualReview|5oclock';
    // this.$store.state.kycInProgressModalModel.kycStatus = 'accepted|25352352352352';

    const addr = this.$store.state.kycInProgressModalModel.address;
    this.handleKycStatus(this.$store.state.kycInProgressModalModel.kycStatus);
    if (this.kycStatus === 'kycneeded') {
      this.title = 'Proof of Non-US Resident';
      const webv = document.createElement('webview');
      webv.addEventListener('did-navigate', (event) => {
        const url = event.url;
        switch (url) {
          case 'https://testnet.aphelion-neo.com:62443/api/kyc/accept':
          case 'https://testnet.aphelion-neo.com:62443/api/kyc/review':
          case 'https://testnet.aphelion-neo.com:62443/api/kyc/deny':
          case 'https://testnet.aphelion-neo.com:62443/api/kyc/repeat': {
            let waitingOnStatus = false;
            const watchInterval = setInterval(async () => {
              if (!waitingOnStatus) {
                waitingOnStatus = true;
                try {
                  const kycStatus = await services.dex.getKycStatus(addr);
                  container.removeChild(webv);
                  this.handleKycStatus(kycStatus);
                  clearInterval(watchInterval);
                } catch (e) {
                  // couldn't get KycStatus, we'll just try again
                  services.alerts.error(`Error retrieving KYC status. ${e}`);
                } finally {
                  waitingOnStatus = false;
                }
              }
            }, 1000);
            break;
          }
          default:
            break;
        }
        console.log(url);
      });
      const address = this.$services.wallets.getCurrentWallet().address;
      const userId = await this.$services.dex.getKycUserId(address);
      webv.src = `https://regtech.identitymind.store/viewform/54sde/?user_id=${userId}`;
      webv.classList.add('kyc-webview');
      container.appendChild(webv);
    }
  },

  methods: {
    handleKycStatus(kycStatus) {
      console.log(`kycStatus: ${kycStatus}`);
      this.kycStatus = kycStatus;
      const content = document.getElementById('aph-kyc-modal').getElementsByClassName('content')[0];
      if (kycStatus.startsWith('accepted')) {
        content.style.height = '300px'; // `${Math.floor(340 / 14)}rem`;
        this.title = 'KYC Accepted (whitelisting in progress...)';
        // const txHash = kycStatus.split('|')[1];
        // could monitor for transaction complete and auto-dismiss...
      } else if (kycStatus.startsWith('manualReview')) {
        this.title = 'KYC Pending Manual Review';
        this.reviewTime = kycStatus.split('|')[1];
        content.style.height = '300px'; // `${Math.floor(340 / 14)}rem`;
      } else if (kycStatus.startsWith('denied')) {
        this.title = 'KYC Application Denied';
        const statusTokens = kycStatus.split('|');
        const timeRemaining = statusTokens[2];
        if (timeRemaining > 0) {
          this.deniedRemainingMinutes = (Math.floor(timeRemaining / 60 / 10) / 100).toString();
          const timeWaiting = statusTokens[1];
          this.deniedWaitingMinutes = (Math.floor(timeWaiting / 60 / 10) / 100).toString();
          content.style.height = '260px';
        } else {
          this.kycStatus = 'kycneeded';
        }
      }
    },
    getHeader() {
      return this.title;
    },
    close() {
      this.$store.commit('setKycInProgressModalModel', null);
    },
  },
};
</script>

<style lang="scss">
  #aph-kyc-modal {

    .content {
      width: toRem(900px);
      height: toRem(760px);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-content: center;

      .header {
        flex: 1;
        font-family: GilroySemiBold;
        font-size: toRem(30px);
        padding: $space-lg $space-lg 0;
        text-align: center;
      }

      .kyc-webview {
        flex: 4;
        overflow: auto;
        height: toRem(600px);
        border: none;
        width: 100%;
      }
      .body {
        flex: 3;
        padding: $space $space-lg $space-lg;

        p {
          font-family: GilroySemiBold;
          font-size: toRem(20px);
          text-align: center;
        }
      }
      .dismiss-btn {
        @extend %btn-footer-light;
        border-bottom-left-radius: $border-radius;
        border-bottom-right-radius: $border-radius;
      }
    }
  }
</style>
