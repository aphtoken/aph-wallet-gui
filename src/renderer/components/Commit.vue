<template>
  <section id="commit-aph">
    <div class="header commit-header">
      <h1>{{ $t('commit') }}.</h1>
      <button class="learn-more" @click="showInfo">{{ $t('learnMore') }}</button>
    </div>
    <div class="body" id="commit-body" v-if="$store.state.commitState">
      <div class="exchange-values">
        <div class="total">
          <div class="icons">
            <aph-icon name="hex"></aph-icon>
            <aph-icon name="award"></aph-icon>
          </div>
          <div class="exchange-val">
            <div class="label">{{ $t('totalFeesCollectedByDex') }}</div>
            <div class="highlight">{{ $formatNumber($store.state.commitState.totalFeesCollected) }} APH</div>
            <div class="estimate"><span>{{ $t('estimated') }} ({{ $store.state.currency }})</span> {{ $formatNumber(aphHolding ? aphHolding.unitValue * $store.state.commitState.totalFeesCollected : 0) }}</div>
          </div>
        </div>
        <div class="since-commit">
          <div class="icons">
            <aph-icon name="hex"></aph-icon>
            <aph-icon name="star"></aph-icon>
          </div>
          <div class="exchange-val">
            <div class="label">{{ $t('totalFeesCollectedSinceCommit') }}</div>
            <div class="highlight">{{ $formatNumber($store.state.commitState.feesCollectedSinceCommit) }} APH</div>
            <div class="estimate"><span>{{ $t('estimated') }} ({{ $store.state.currency }})</span> {{ $formatNumber(aphHolding ? aphHolding.unitValue * $store.state.commitState.feesCollectedSinceCommit : 0) }}</div>
          </div>
        </div>
      </div>
      <div class="user-values">
        <div class="value">
          <h2 class="underlined">{{ $t('amountCommitted') }}</h2>
          <div class="highlight">{{ $formatNumber($store.state.commitState.quantityCommitted) }} APH</div>
          <div class="lower"><span>{{ $t('estimated') }} ({{ $store.state.currency }})</span> {{ $formatNumber(aphHolding ? aphHolding.unitValue * $store.state.commitState.quantityCommitted : 0) }}</div>
        </div>
        <div class="date">
          <h2 class="underlined">{{ $t('dateCommitted') }}</h2>
          <div class="highlight">{{ $formatDate($store.state.commitState.contributionTimestamp) }}</div>
          <div class="lower">
            <span>{{ $t('time') }}</span>{{ $formatTime($store.state.commitState.contributionTimestamp) }}
            <span>{{ $t('block') }}</span>{{ $store.state.commitState.contributionHeight }}
          </div>
        </div>
        <div class="weight">
          <h2 class="underlined">{{ $t('myWeight') }}</h2>
          <div class="highlight">{{ $formatNumber($store.state.commitState.weightPercentage) }}%</div>
          <div class="lower"><span>{{ $t('myWeight') }}</span>{{ $abbreviateNumber($store.state.commitState.userWeight) }}</div>
          <div class="lower"><span>{{ $t('networkWeight') }}</span>{{ $abbreviateNumber($store.state.commitState.networkWeight) }}</div>
        </div>
        <div class="earned">
          <h2 class="underlined">{{ $t('feesEarned') }}</h2>
          <div class="highlight">~{{ $store.state.commitState.availableToClaim }} APH</div>
          <div class="lower">{{ $t('estimated') }} ({{ $store.state.currency }}) {{ $formatNumber(aphHolding ? aphHolding.unitValue * $store.state.commitState.availableToClaim : 0) }}</div>
        </div>
      </div>
      <div class="actions">
        <div class="commit">
          <button class="btn-square" @click="showCommitModal()"
              :disabled="shouldDisableCommitButton">
            <div>
              <aph-icon name="commit"></aph-icon>
              <p>{{ $t('commit') }}</p>
            </div>
          </button>
        </div>
        <div class="claim-info">
          <div class="value" v-if="$store.state.commitState.quantityCommitted > 0">
            <div v-if="$store.state.commitState.ableToClaimHeight > currentBlock">
              <h2>{{ $store.state.commitState.ableToClaimHeight - currentBlock }}</h2>
              <div>{{ $t('blocksUntilClaim') }} ({{ $store.state.commitState.ableToCompoundHeight }})</div>
            </div>
            <div v-else-if="$store.state.commitState.ableToCompoundHeight > currentBlock">
              <h2>{{ $store.state.commitState.ableToCompoundHeight - currentBlock }}</h2>
              <div>{{ $t('blocksUntilCompound') }} ({{ $store.state.commitState.ableToCompoundHeight }})</div>
            </div>
            <div v-else>
              <h2>-</h2>
              <div>{{ $t('eligibleToCompound') }}</div>
            </div>
            <div><span>{{ $t('currentBlock') }}</span>{{ currentBlock }}</div>
          </div>
          <div class="value" v-else>
            <h2>-</h2>
            <div>{{ $t('commitAphelionToBeEligible') }}</div>
            <div><span>{{ $t('currentBlock') }}</span>{{ currentBlock }}</div>
          </div>
        </div>
      </div>
      <div class="buttons">
        <button class="btn-square" @click="showClaimModal()"
          :disabled="shouldDisableClaimButton">
          <div>
            <aph-icon name="claim"></aph-icon>
            <p>{{ $t('claim') }}</p>
          </div>
        </button>
        <button class="btn-square" @click="compound()"
          :disabled="shouldDisableCompoundButton">
          <div>
            <aph-icon name="compound"></aph-icon>
            <p>{{ $t('compound') }}</p>
          </div>
        </button>
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
    this.$store.commit('setShowPortfolioHeader', true);
    clearInterval(loadCommitStateIntervalId);
  },

  mounted() {
    this.$store.commit('setShowPortfolioHeader', false);
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
        const holding = _.find(this.$store.state.holdings, { assetId: this.currentNetwork.aph_hash });

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
  display: flex;
  flex-direction: column;
  flex: 1;
  margin: $space-lg;

  .header.commit-header {
    max-width: toRem(1105px);
    min-width: toRem(1150px);
    padding-left: $space-lg;
  }

  .header {
    color: $purple;
    flex-basis: 15%;
    font-family: 'GilroySemibold';

    h1 {
      display: inline-block;
      font-size: toRem(38px);
    }

    .learn-more {
      @extend %btn;

      display: inline-block;
      margin: 0 $space;
      padding: 0 $space-lg;
      transform: translate(0%, toRem(-10px));
      width: auto;

      &:hover {
        box-shadow: $box-shadow-sm;
      }
    }
  }

  .body {
    display: flex;
    flex-direction: column;
  }

  #commit-body {
    display: flex;
    flex-direction: column;
    flex: 1 0 85%;
    max-width: toRem(1105px);
    min-width: toRem(1150px);

    .exchange-values {
      display: flex;
      justify-content: space-around;
      margin-bottom: $space-lg;

      .total {
        display: flex;
        padding-right: $space-xl;
      }

      .since-commit {
        display: flex;
      }

      .label {
        font-family: 'Gilroy';
        font-size: toRem(18px);
        max-width: toRem(250px);
      }

      .highlight {
        color: $purple;
        font-family: 'GilroySemibold';
        font-size: toRem(28px);
        padding: $space-sm 0;
      }

      .estimate {
        text-transform: uppercase;
      }

      .icons {
        margin: toRem(23px) $space-lg 0 0;
        position: relative;
        width: toRem(80px);

        .aph-icon {
          position: absolute;
          width: toRem(55px);

          .icon {
            svg {
              margin-top: 10%;
              position: relative;
            }

            &.star {
              margin: toRem(5px) 0 0 0;
            }

            &.hex {
              margin: toRem(-25px);
              .fill {
                fill: $grey;
              }
            }
          }
        }
      }
    }

    .user-values {
      background-color: white;
      display: flex;
      flex-direction: row;
      margin-bottom: $space-lg;
      padding: $space-lg;

      &> div {
        flex: 1;
      }

      .underlined {
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

        &> span {
          color: $grey;
          margin: 0 $space 0 0;
        }
      }
    }

    .actions {
      display: flex;
      flex-direction: row;
      flex: 1;
      max-height: toRem(339px);

      &> div {
        flex: 1 1 50%;
      }

      .btn-square {
        @extend %btn-square;

        flex-direction: row;
        font-size: toRem(55px);
        padding: 3rem 0;
        width: toRem(200px);

        &> div {
          width: 100%;

          &> p {
            font-size: toRem(18px);
            padding-top: $space-lg;
          }
        }

        &:disabled {
          background-color: $grey;
          color: $dark;
        }

        &:enabled {
          background-color: $purple;
          color: white;
        }

        .aph-icon {
          .fill {
            fill: $dark;
          }
        }

        &:hover {
          background: $purple-hover;
          color: white;

          .aph-icon {
            .fill {
              fill: white;
            }
          }
        }
      }

      .commit {
        margin-left: $space-lg;
        margin-right: $space-lg;
      }

      .claim-info {
        background-color: white;
        display: flex;
        justify-content: center;
        margin-bottom: $space;

        &> div {
          font-size: toRem(14px);
          text-align: center;
          text-transform: uppercase;

          &> div {
            margin: $space;

            span {
              color: $dark-grey;
              display: block;
            }
          }
        }

        h2 {
          color: $purple;
          font-size: 30px;
          margin: toRem(17px);
        }
      }
    }

    .buttons {
      display: flex;
      justify-content: space-around;
      margin-left: auto;
      max-height: toRem(50px);
      padding-left: $space-lg;
      width: 50%;

      .btn-square {
        @extend %btn-square;

        flex-direction: row;
        font-size: toRem(55px);
        padding: 3rem 0;
        position: relative;
        top: -100px;
        width: toRem(200px);

        &> div {
          width: 100%;

          &> p {
            font-size: toRem(18px);
            padding-top: $space-lg;
          }
        }

        &:disabled {
          background-color: $grey;
          color: $dark;
        }

        &:enabled {
          background-color: $purple;
          color: white;
        }

        .aph-icon {
          .fill {
            fill: $dark;
          }
        }

        &:hover {
          background: $purple-hover;
          color: white;

          .aph-icon {
            .fill {
              fill: white;
            }
          }
        }
      }
    }
  }
}
</style>
