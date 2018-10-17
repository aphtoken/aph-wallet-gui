<template>
  <modal-wrapper id="aph-withdraw-in-progress-modal">
    <div class="header">{{$t('withdrawSystemAsset', $store.state.systemWithdraw)}}</div>
    <div class="body">
      <div class="checklist">
        <div class="checklist-header">{{$t('steps')}}</div>
        <ul>
          <li :class="stepClass(0)"><span>{{stepIndicator(0)}}</span>{{step0Label}}</li>
          <li :class="stepClass(1)"><span>{{stepIndicator(1)}}</span>{{step1Label}}</li>
          <li :class="stepClass(2)"><span>{{stepIndicator(2)}}</span>{{step2Label}}</li>
          <!-- Removed showing this step for now by business decision. -->
          <!-- <li :class="stepClass(3)"><span>{{stepIndicator(3)}}</span>{{step3Label}}</li> -->
          <li :class="stepClass(4)"><span>{{stepIndicator(4)}}</span>{{step4Label}}</li>
          <li :class="stepClass(5)"><span>{{stepIndicator(5)}}</span>{{step5Label}}</li>
        </ul>

        <div class="error" v-if="error !== null">
          {{error}}
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="cancel-btn" @click="close">{{closeLabel}}</div>
    </div>
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
          if (this.$store.state.systemWithdraw
            && (this.$store.state.systemWithdraw.step >= 5 || this.$store.state.systemWithdraw.error)) {
            return 'Close';
          }
          return 'Close (withdraw continues in background)';
        },
        error() {
          if (this.$store.state.systemWithdraw && this.$store.state.systemWithdraw.error) {
            return this.$store.state.systemWithdraw.error;
          }
          return null;
        },
        step0Label() {
          return this.$t('withdrawStepCalculatingWithdrawInputs');
        },
        step1Label() {
          return this.$t('withdrawStepMarkSystemAsset', this.$store.state.systemWithdraw);
        },
        step2Label() {
          return this.$t('withdrawStepWaitForMarkSystemAsset', this.$store.state.systemWithdraw);
        },
        /* Removed by business decision.
        step3Label() {
          return this.$t('withdrawStepWithdrawSystemAsset', this.$store.state.systemWithdraw);
        }, */
        step4Label() {
          return this.$t('withdrawStepWaitForWithdrawSystemAsset', this.$store.state.systemWithdraw);
        },
        step5Label() {
          return this.$t('success');
        },
      },
      methods: {
        close() {
          this.$store.commit('setWithdrawInProgressModalModel', false);
        },
        stepClass(step) {
          if (this.$store.state.systemWithdraw) {
            if (this.$store.state.systemWithdraw.step === step) {
              return ['in-progress'];
            }
            if (this.$store.state.systemWithdraw.step > step) {
              return ['complete'];
            }
          }
          return [];
        },
        stepIndicator(step) {
          if (!this.$store.state.systemWithdraw || (this.$store.state.systemWithdraw.step <= step
            && this.$store.state.systemWithdraw.step < 5)) {
            // Adjust the step number to skip showing step 3 (business decision).
            return `${step + (step < 4 ? 1 : 0)}.`;
          }
          return '✔';
        },
      },
    };
</script>

<style lang="scss">
#aph-withdraw-in-progress-modal {
  .content {
    width: toRem(600px);
  }
  .header {
    font-size: toRem(30px);
    padding: $space-lg $space-lg 0;
    text-align: center;
  }
  .body {
    display: block;
    padding: $space-lg;
    text-align: center;
    p {
      margin: 0;

      &:first-child {
        span {
          font-family: GilroySemibold;
        }
      }
      & + p {
        margin-top: $space-lg;
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
      margin: 0 auto;
      max-width: toRem(400px);
      text-align: left;
      .checklist-header {
        font-size: toRem(20px);
        font-family: GilroyMedium;
        padding: $space-lg;
        text-align: center;
      }
      ul {
        margin: 0;
        list-style: none;
        li {
          color: $grey;
          padding: $space-sm 0;

          span {
            padding: $space-sm;
          }
          &.in-progress {
            color: $dark;
            font-family: GilroySemibold;
            &:last-child {
              color: $green;
            }
          }
          &.complete {
            color: $dark;

            span {
              color: $green;
            }
          }
        }
      }
      .error {
        color: $red;
        font-size: toRem(15px);
        font-family: GilroySemibold;
        text-align: center;
        padding: $space;
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
    border-bottom-right-radius: $border-radius;
  }
}
</style>
