<template>
  <div>
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
      <div v-if="kycStatus.startsWith('disabled')">
        <p>We are temporarily not accepting KYC applications.</p>
        <p>This issue should be remedied in the near future. Please be patient and try again later. </p>
      </div>
    </body>

    <button class="dismiss-btn" @click="close">Dismiss</button>
  <!-- </div> -->
  </modal-wrapper>
  <aph-confirm-dismiss-kyc-modal v-if="$store.state.confirmDismissKyc"
                                 :onContinue="handleContinue" :onDismiss="handleDismiss"/>
  </div>
</template>

<script>
import { webFrame } from 'electron';
import ModalWrapper from './ModalWrapper';
import AphConfirmDismissKycModal from './ConfirmDismissKycModal';


export default {
  components: {
    ModalWrapper,
    AphConfirmDismissKycModal,
  },
  data() {
    return {
      title: 'Loading',
      kycStatus: 'kycneeded',
      reviewTime: '',
      deniedWaitingMinutes: '',
      deniedRemainingMinutes: '',
      zoomFactor: 1,
    };
  },

  async mounted() {
    const container = document.getElementById('frame-content');
    this.zoomFactor = webFrame.getZoomFactor();
    webFrame.setZoomFactor(1);
    const services = this.$services;
    const store = this.$store;
    // For testing:
    // this.$store.state.kycInProgressModalModel.kycStatus = 'disabled';
    // this.$store.state.kycInProgressModalModel.kycStatus = 'denied|100000|0';
    // this.$store.state.kycInProgressModalModel.kycStatus = 'denied|100000|100000';
    // this.$store.state.kycInProgressModalModel.kycStatus = 'manualReview|5oclock';
    // this.$store.state.kycInProgressModalModel.kycStatus = 'accepted|25352352352352';

    const address = store.state.kycInProgressModalModel.address;
    this.handleKycStatus(store.state.kycInProgressModalModel.kycStatus);
    if (this.kycStatus === 'kycneeded') {
      const webv = document.createElement('webview');
      webv.addEventListener('did-navigate', (event) => {
        const url = event.url;
        switch (url) {
          case `${this.$store.state.currentNetwork.aph}/kyc/accept`:
          case `${this.$store.state.currentNetwork.aph}/kyc/review`:
          case `${this.$store.state.currentNetwork.aph}/kyc/deny`:
          case `${this.$store.state.currentNetwork.aph}/kyc/repeat`: {
            let waitingOnStatus = false;
            const watchInterval = setInterval(async () => {
              if (!waitingOnStatus) {
                waitingOnStatus = true;
                try {
                  const kycStatus = await services.dex.getKycStatus(address);
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
      const userId = await services.dex.getKycUserId(address);
      webv.src = `${this.$store.state.currentNetwork.kycUrl}?user_id=${userId}`;
      webv.classList.add('kyc-webview');
      container.appendChild(webv);
    }
  },

  methods: {
    handleContinue() {
    },
    handleDismiss() {
      this.$store.commit('setKycInProgressModalModel', null);
      webFrame.setZoomFactor(this.zoomFactor);
    },
    handleKycStatus(kycStatus) {
      console.log(`kycStatus: ${kycStatus}`);
      this.kycStatus = kycStatus;
      const modal = document.getElementById('aph-kyc-modal');
      if (modal == null) return;
      const content = modal.getElementsByClassName('content')[0];
      if (content == null) return;

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
      } else if (kycStatus.startsWith('disabled')) {
        content.style.height = '300px';
        this.title = 'KYC Temporarily Disabled';
      }

      if (this.kycStatus === 'kycneeded') {
        this.title = 'Proof of Non-US Resident';
      }
    },
    getHeader() {
      return this.title;
    },
    close() {
      if (this.kycStatus === 'kycneeded') {
        this.$store.commit('setConfirmDismissKyc', true);
        return;
      }
      this.$store.commit('setKycInProgressModalModel', null);
      webFrame.setZoomFactor(this.zoomFactor);
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

      #frame-content {
        flex: auto;
        width: 100%;
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
