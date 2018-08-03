<template>
  <section id="commit-aph">
    <div class="header">
      <h1>{{$t('commit')}}.</h1>
      <button class="learn-more" @click="showInfo">{{$t('learnMore')}}</button>
    </div>
    <div class="body" v-if="$store.state.commitState">
      <div class="exchange-values">
        <div class="since-commit">
          <div class="icons">
            <aph-icon name="hex"></aph-icon>
            <aph-icon name="star"></aph-icon>
          </div>
          <div class="exchange-val">
            <div class="label">{{$t('totalFeesCollectedSinceCommit')}}</div>
            <div class="highlight">{{$formatNumber($store.state.commitState.feesCollectedSinceCommit)}} APH</div>
            <div class="estimate">{{ $t('estimated') }} ({{ $store.state.currency }}) <span>{{$formatNumber(aphHolding ? aphHolding.unitValue * $store.state.commitState.feesCollectedSinceCommit : 0)}}</span></div>
          </div>
        </div>
        <div class="total">
          <div class="icons">
            <aph-icon name="hex"></aph-icon>
            <aph-icon name="award"></aph-icon>
          </div>
          <div class="exchange-val">
            <div class="label">{{$t('totalFeesCollectedByDex')}}</div>
            <div class="highlight">{{$formatNumber($store.state.commitState.totalFeesCollected)}} APH</div>
            <div class="estimate">{{ $t('estimated') }} ({{ $store.state.currency }}) <span>{{$formatNumber(aphHolding ? aphHolding.unitValue * $store.state.commitState.totalFeesCollected : 0)}}</span></div>
          </div>
        </div>
      </div>
      <div class="user-values">
        <div class="value">
          <h2 class="underlined">{{$t('amountCommitted')}}</h2>
          <div class="highlight">{{$formatNumber($store.state.commitState.quantityCommitted)}} APH</div>
          <div class="lower"><span>{{ $t('estimated') }} ({{ $store.state.currency }})</span> {{$formatNumber(aphHolding ? aphHolding.unitValue * $store.state.commitState.quantityCommitted : 0)}}</div>
        </div>
        <div class="date">
          <h2 class="underlined">{{$t('dateCommitted')}}</h2>
          <div class="highlight">{{$formatDate($store.state.commitState.contributionTimestamp)}}</div>
          <div class="lower">
            <span>{{$t('time')}}</span>{{$formatTime($store.state.commitState.contributionTimestamp)}}
            <span>{{$t('block')}}</span>{{$store.state.commitState.contributionHeight}}
          </div>
        </div>
        <div class="weight">
          <h2 class="underlined">{{$t('myWeight')}}</h2>
          <div class="highlight">{{$formatNumber($store.state.commitState.weightPercentage)}}%</div>
          <div class="lower"><span>{{$t('myWeight')}}</span>{{$formatNumber($store.state.commitState.userWeight)}}</div>
          <div class="lower"><span>{{$t('networkWeight')}}</span>{{$formatNumber($store.state.commitState.networkWeight)}}</div>
        </div>
        <div class="earned">
          <h2 class="underlined">{{$t('feesEarned')}}</h2>
          <div class="highlight">~{{$store.state.commitState.availableToClaim}} APH</div>
          <div class="lower">{{ $t('estimated') }} ({{ $store.state.currency }}) {{$formatNumber(aphHolding ? aphHolding.unitValue * $store.state.commitState.availableToClaim : 0)}}</div>
        </div>
      </div>
      <div class="actions">
        <div class="commit">
          <div class="btn-square" @click="showCommitModal()"
              :disabled="shouldDisableCommitButton">
            <aph-icon name="commit"></aph-icon>
            <p>{{$t('commit')}}</p>
          </div>
        </div>
        <div class="claim-info">
          <div class="value" v-if="$store.state.commitState.quantityCommitted > 0">
            <div v-if="$store.state.commitState.ableToClaimHeight > currentBlock">
              <h2>{{$store.state.commitState.ableToClaimHeight - currentBlock}}</h2>
              <div>{{$t('blocksUntilClaim')}} ({{$store.state.commitState.ableToCompoundHeight}})</div>
            </div>
            <div v-else-if="$store.state.commitState.ableToCompoundHeight > currentBlock">
              <h2>{{$store.state.commitState.ableToCompoundHeight - currentBlock}}</h2>
              <div>{{$t('blocksUntilCompound')}} ({{$store.state.commitState.ableToCompoundHeight}})</div>
            </div>
            <div v-else>
              <h2>-</h2>
              <div>{{$t('eligibleToCompound')}}</div>
            </div>
            <div><span>{{$t('currentBlock')}}</span>{{ $formatNumber(currentBlock) }}</div>
          </div>
          <div class="value" v-else>
            <h2>-</h2>
            <div class="help-text">{{$t('commitAphelionToBeEligible')}}</div>
            <div class="block">
              <div class="label">{{$t('currentBlock')}}</div>
              <div class="value">{{ $formatNumber(currentBlock) }}</div>
            </div>
          </div>
          <div class="buttons">
            <div class="btn-square claim" @click="showClaimModal()"
              :disabled="shouldDisableClaimButton">
              <aph-icon name="claim"></aph-icon>
              <p>{{$t('claim')}}</p>
            </div>
            <div class="btn-square" @click="compound()"
              :disabled="shouldDisableCompoundButton">
              <aph-icon name="compound"></aph-icon>
              <p>{{$t('compound')}}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <commit-info v-if="!$store.state.acceptCommitInfo"></commit-info>
    <commit-modal v-if="$store.state.commitModalModel"
      :onConfirmed="commitConfirmed" :onCancel="hideCommitModal"></commit-modal>
    <claim-modal v-if="$store.state.claimModalModel"
      :onConfirmed="claimConfirmed" :onCancel="hideClaimModal"></claim-modal>
  </section>
</template>

<script>
import { BigNumber } from 'bignumber.js';
import { mapGetters } from 'vuex';
import CommitInfo from './modals/CommitInfo';
import CommitModal from './modals/CommitModal';
import ClaimModal from './modals/ClaimModal';

let loadCommitStateIntervalId;
export default {
  components: {
    CommitInfo,
    CommitModal,
    ClaimModal,
  },

  beforeDestroy() {
    this.$store.state.showPortfolioHeader = true;
    clearInterval(loadCommitStateIntervalId);
  },

  mounted() {
    this.$store.state.showPortfolioHeader = false;
    this.$store.dispatch('fetchCommitState');

    loadCommitStateIntervalId = setInterval(() => {
      this.$store.dispatch('fetchCommitState');
    }, this.$constants.intervals.HOLDINGS_POLLING);
  },

  data() {
    return {
      feesWhenCommitted: 0,
      totalFeesCollected: 0,
      aphCommitted: 0,
      dateCommitted: 0,
      availableToClaim: 0,
      blockCommitted: 0,
      feesWhenCommittedEstimate: 0,
    };
  },
  computed: {
    ...mapGetters([
      'currentNetwork',
    ]),
    shouldDisableCommitButton() {
      return this.$store.state.commitState.quantityCommitted > 0;
    },
    shouldDisableClaimButton() {
      return this.$store.state.commitState.quantityCommitted <= 0;
    },
    shouldDisableCompoundButton() {
      return this.$store.state.commitState.quantityCommitted <= 0
        || this.$store.state.commitState.ableToCompoundHeight > this.currentBlock;
    },
    currentBlock() {
      return this.currentNetwork && this.currentNetwork.bestBlock ? this.currentNetwork.bestBlock.index : 0;
    },
    blocksSinceCommitted() {
      if (this.blockCommitted <= 0) {
        return 0;
      }
      return this.currentBlock - this.blockCommitted;
    },
    aphHolding() {
      if (this.$store.state.holdings) {
        const holding = _.find(this.$store.state.holdings, (o) => {
          return o.asset === this.$constants.assets.APH;
        });

        if (holding) {
          return holding;
        }
      }

      return {
        symbol: 'APH',
        balance: 0,
        totalBalance: 0,
        contractBalance: 0,
        openOrdersBalance: 0,
        unitValue: 0,
      };
    },
  },

  methods: {
    showInfo() {
      this.$store.commit('setAcceptCommitInfo', false);
    },
    showCommitModal() {
      if (this.$store.state.commitState.quantityCommitted > 0) {
        /* eslint-disable max-len */
        this.$services.alerts.error('You already have APH committed. You must first claim it and then re-commit to add more.');
        return;
      }

      this.$store.commit('setCommitModalModel', {
        amount: 0,
      });
    },
    hideCommitModal() {
      this.$store.commit('setCommitModalModel', null);
    },
    commitConfirmed(amount) {
      this.$services.dex.commitAPH(new BigNumber(amount).toNumber());
      this.hideCommitModal();
    },

    showClaimModal() {
      if (this.$store.state.commitState.quantityCommitted <= 0) {
        /* eslint-disable max-len */
        this.$services.alerts.error('You do not yet have any APH committed. You must first commit it and wait the minimum numer of required blocks.');
        return;
      }

      this.$store.commit('setClaimModalModel', {
      });
    },
    hideClaimModal() {
      this.$store.commit('setClaimModalModel', null);
    },
    claimConfirmed() {
      this.$services.dex.claimAPH();
      this.hideClaimModal();
    },

    compound() {
      this.$services.dex.compoundAPH();
    },
  },
};
</script>

<style lang="scss">
#commit-aph {
  align-items: center;
  justify-content: center;
  margin: $space-xl;

  .header {
    color: $purple;
    font-family: GilroySemibold;
    margin: 0 $space-lg $space;

    h1 {
      display: inline-block;
      font-size: toRem(42px);
    }

    .learn-more {
      @extend %btn;
      display: inline-block;
      width: auto;
      padding: 0 $space-lg;
      margin: 0 $space;
      transform: translate(0%, toRem(-10px));

      &:hover {
        box-shadow: $box-shadow-sm;
      }
    }
  }

  .body {
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    flex: 1;

    p {
      line-height: $copy-line-height;
      margin: 0;

      & + P {
        margin-top: $space;
      }
    }


    .icon {
      flex: 1;
      text-align: center;

      svg {
        height: toRem(42px);
      }
    }

    .exchange-values {
      align-items: center;
      display: flex;
      flex-direction: row;

      > div {
        display: flex;
        flex-direction: row;
        width: 25vw;

        &.since-commit {
          margin: 0 $space-lg;
        }

        .exchange-val {
          display: flex;
          flex-direction: column;
        }
      }

      .label {
        font-family: 'GilroyMedium';
        font-size: toRem(16px);
      }

      .highlight {
        color: $purple;
        font-size: toRem(22px);
        padding: $space-sm 0;
        font-family: 'GilroySemibold';
      }

      .estimate {
        @extend %small-uppercase-grey-label-dark;

        > span {
          color: $dark;
        }
      }

      .icons {
        margin-right: $space-lg;
        position: relative;

        .aph-icon {
          &.aph-icon--hex {
            svg {
              height: toRem(100px);
            }

            .fill {
              fill: $grey;
            }
          }

          &.aph-icon--star, &.aph-icon--award {
            left: 50%;
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);

            svg {
              height: toRem(50px);
            }

            .fill {
              fill: $dark;
            }
          }

          &.aph-icon--star {
            .fill {
              fill: $purple;
            }
          }
        }
      }
    }

    .user-values {
      background-color: white;
      display: flex;
      flex-direction: row;
      padding: $space-lg;
      margin: $space-lg 0;

      > div {
        flex: 1;
      }

      h2.underlined {
        @extend %underlined-header-sm;
        font-size: toRem(24px);
      }

      .highlight {
        color: $purple;
        font-family: 'GilroySemibold';
        font-size: toRem(18px);
        margin: 0 0 $space 0;
      }

      .lower {
        text-transform: uppercase;
      }

      span {
        color: $grey;
        margin: 0 $space 0 0;
      }
    }

    .actions {
      display: flex;
      flex-direction: row;

      > div {
        flex: 1;
      }

      > .commit {
        margin-left: $space-lg;
      }

      .btn-square {
        @extend %btn-square;

        background: $grey;

        &:disabled {
          background-color: $grey;
        }

        .aph-icon {
          .fill {
            fill: $dark-grey;
          }
        }

        p {
          color: $dark-grey;
        }

        &:hover {
          p {
            color: white;
          }
        }
      }


      .claim-info {
        background-color: white;
        padding: $space-lg $space-lg toRem(175px/2) $space-lg;

        > div {
         text-align: center;
         font-size: toRem(18px);

         > div {
            span {
              color: $dark-grey;
              display: block;
            }
          }
        }

        .help-text {
          @extend %small-uppercase-grey-label-dark;
        }

        .block {
          margin-top: $space;

          .label {
            @extend %small-uppercase-grey-label-dark;
          }

          .value {
            @extend %small-uppercase-grey-label-dark;

            color: $dark;
          }
        }

        h2 {
          color: $purple;
          font-size: 30px;
        }

        .buttons {
          display: flex;
          flex-direction: row;
          justify-content: center;
          margin: $space 0 toRem(-175px);


          .btn-square {
            &.claim {
              background: $purple;

              p {
                color: white;
              }

              .aph-icon {
                .fill {
                  fill: $dark;
                }
              }
            }

            & + .btn-square {
              margin-left: $space-lg;
            }
          }
        }
      }
    }
  }

  .footer {
    display: flex;
    flex-direction: row;
    flex: none;
    width: toRem(500px);

    .link-btn {
      @extend %btn-outline;
    }
  }

}
</style>
