<template>
  <modal-wrapper id="aph-claim-gas-modal" identifier="claimGas">
    <template>
      <div class="body" v-if="$store.state.gasClaim">
        <p>Claiming GAS which has accumulated from your NEO holdings takes several steps. We've automated the process for you but it may take up to 5 minutes.</p>
        <p>Please wait for the GAS claim to complete.</p>
        <p>Closing your wallet during this process may result in the GAS claim failing and require you to run it again.</p>
        <div class="checklist">
          <div class="checklist-header">Steps:</div>
          <ol>
            <li :class="[{'in-progress': $store.state.gasClaim.step == 1}, {complete: $store.state.gasClaim.step > 1}]">{{step1Label}}</li>
            <li :class="[{'in-progress': $store.state.gasClaim.step == 2}, {complete: $store.state.gasClaim.step > 2}]">{{step2Label}}</li>
            <li :class="[{'in-progress': $store.state.gasClaim.step == 3}, {complete: $store.state.gasClaim.step > 3}]">{{step3Label}}</li>
            <li :class="[{'in-progress': $store.state.gasClaim.step == 4}, {complete: $store.state.gasClaim.step > 4}]">{{step4Label}}</li>
            <li :class="[{'in-progress': $store.state.gasClaim.step == 5}, {complete: $store.state.gasClaim.step > 5}]">{{step5Label}}</li>
          </ol>

          <div class="error" v-if="$store.state.gasClaim.error">
            {{$store.state.gasClaim.error}}
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="cancel-btn" @click="close">{{closeLabel}}</div>
      </div>
    </template>
  </modal-wrapper>
</template>

<script>
import ModalWrapper from './ModalWrapper';

export default {
  components: {
    ModalWrapper,
  },

  computed: {
    closeLabel() {
      if (this.$store.state.gasClaim && this.$store.state.gasClaim.step >= 5) {
        return 'Close';
      }
      return 'Cancel';
    },

    step1Label() {
      if (this.$store.state.gasClaim && this.$store.state.gasClaim.step > 1) {
        return `Transferred ${this.$store.state.gasClaim.neoTransferAmount} NEO to yourself.`;
      } else if (this.$store.state.gasClaim && this.$store.state.gasClaim.step === 1) {
        return `Transferring ${this.$store.state.gasClaim.neoTransferAmount} NEO to yourself.`;
      }
      return 'Transfer all NEO to yourself.';
    },
    step2Label() {
      if (this.$store.state.gasClaim && this.$store.state.gasClaim.step > 2) {
        return 'Received NEO transfer confirmation.';
      } else if (this.$store.state.gasClaim && this.$store.state.gasClaim.step === 2) {
        return 'Waiting for NEO transfer confirmation.';
      }
      return 'Wait for NEO transfer confirmation.';
    },

    step3Label() {
      if (this.$store.state.gasClaim && this.$store.state.gasClaim.step > 3) {
        return `Sent claim for ~${this.$store.state.gasClaim.gasClaimAmount} GAS.`;
      } else if (this.$store.state.gasClaim && this.$store.state.gasClaim.step === 3) {
        return `Sending claim for ~${this.$store.state.gasClaim.gasClaimAmount} GAS.`;
      }
      return 'Send GAS claim.';
    },

    step4Label() {
      if (this.$store.state.gasClaim && this.$store.state.gasClaim.step > 4) {
        return 'GAS claim confirmed.';
      } else if (this.$store.state.gasClaim && this.$store.state.gasClaim.step === 4) {
        return 'Waiting for GAS claim confirmation.';
      }
      return 'Wait for GAS claim confirmation.';
    },

    step5Label() {
      if (this.$store.state.gasClaim && this.$store.state.gasClaim.step === 5) {
        return 'Success!';
      }
      return 'Wait for GAS claim transaction details.';
    },
  },

  methods: {
    close() {
      this.$store.commit('setSendInProgress', false);
      this.$store.commit('setShowGasClaimModal', false);
    },
  },
};
</script>


<style lang="scss">
#aph-claim-gas-modal {
  .content {
    width: toRem(600px);
  }

  .header {
    padding: $space-lg $space-lg 0;
  }

  .body {
    padding: $space-lg;
    text-align: center;
    display: block;
    position: relative;

    p {
      margin-bottom: $space-lg;
      line-height: $line-height;

      &:first-child {
        span {
          font-family: GilroySemibold;
        }
      }
    }

    .aph-icon {
      svg {
        height: $space-xl;
      }

      & + p {
        margin-top: $space-xl;
      }
    }

    .checklist {
      max-width: toRem(450px);
      margin: 0 auto;
      text-align: left;

      .checklist-header {
        font-weight: bold;
        margin: 2rem;
        text-align: center;
        font-size: larger;
      }

      ol {
        li {
          padding: toRem(3px);

          &.in-progress {
            font-weight: bold;

            &:last-child {
              color: $green;
              font-size: larger;
            }
          }

          &.complete {
            text-decoration: line-through;
          }
        }
      }

      .error {
        color: $red;
      }
    }
  }

  .footer {
    display: flex;

    > * {
      flex: 1;
    }
  }

  .cancel-btn {
    @extend %btn-footer-light;

    border-bottom-left-radius: $border-radius;
  }
}
</style>

