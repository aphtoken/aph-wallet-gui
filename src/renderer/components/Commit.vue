<template>
  <section id="commit-aph">
    <div class="header">
      <h1>{{$t('commit')}}.</h1>
      <button class="learn-more" @click="showInfo">{{$t('learnMore')}}</button>
    </div>
    <div class="body" v-if="$store.state.commitState">
      <div class="exchange-values">
        <div class="total">
          <div class="icons">
            <aph-icon name="hex"></aph-icon>
            <aph-icon name="award"></aph-icon>
          </div>
          <div class="exchange-val">
            <div class="label">{{$t('totalFeesCollectedByDex')}}</div>
            <div class="highlight">{{$formatNumber($store.state.commitState.totalFeesCollected)}} APH</div>
            <div class="estimate"><span>{{ $t('estimated') }} ({{ $store.state.currency }})</span> {{$formatNumber(aphHolding ? aphHolding.unitValue * $store.state.commitState.totalFeesCollected : 0)}}</div>
          </div>
        </div>
        <div class="since-commit">
          <div class="icons">
            <aph-icon name="hex"></aph-icon>
            <aph-icon name="star"></aph-icon>
          </div>
          <div class="exchange-val">
            <div class="label">{{$t('totalFeesCollectedSinceCommit')}}</div>
            <div class="highlight">{{$formatNumber($store.state.commitState.feesCollectedSinceCommit)}} APH</div>
            <div class="estimate"><span>{{ $t('estimated') }} ({{ $store.state.currency }})</span> {{$formatNumber(aphHolding ? aphHolding.unitValue * $store.state.commitState.feesCollectedSinceCommit : 0)}}</div>
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
          <button class="btn-square" @click="showCommitModal()"
              :disabled="shouldDisableCommitButton">
            <div>
              <aph-icon name="commit"></aph-icon>
              <p>{{$t('commit')}}</p>
            </div>
          </button>
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
            <div><span>{{$t('currentBlock')}}</span>{{ currentBlock }}</div>
          </div>
          <div class="value" v-else>
            <h2>-</h2>
            <div>{{$t('commitAphelionToBeEligible')}}</div>
            <div><span>{{$t('currentBlock')}}</span>{{ currentBlock }}</div>
          </div>
          <div class="buttons">
            <button class="btn-square" @click="showClaimModal()"
              :disabled="shouldDisableClaimButton">
              <div>
                <aph-icon name="claim"></aph-icon>
                <p>{{$t('claim')}}</p>
              </div>
            </button>
            <button class="btn-square" @click="compound()"
              :disabled="shouldDisableCompoundButton">
              <div>
                <aph-icon name="compound"></aph-icon>
                <p>{{$t('compound')}}</p>
              </div>
            </button>
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
    margin: 0 $space $space $space;

    h1 {
      display: inline-block;
      font-size: toRem(38px);
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
      display: flex;
      flex-direction: row;
      justify-content: center;
        
      &> div {
        display:flex;
        flex-direction: row;
        flex: 1;
        max-width: toRem(500px);
        margin-right: $space;

        &> .exchange-val {
          display: flex;
          flex-direction: column;
        }
      }
      
      .label {
        font-size: toRem(22px);
        font-family: 'GilroySemibold';
      }
      
      .highlight {
        color: $purple;
        font-size: toRem(28px);
        padding: $space-sm 0;
        font-family: 'GilroySemibold';
      }
      
      .estimate {
        text-transform: uppercase;
      }
        
      .icons {
        position: relative;
        margin: $space toRem(5px) 0 0;
        width: toRem(80px);
        height: toRem(80px);
          
        .aph-icon {
          position: absolute;
          width: toRem(40px);
          height: toRem(40px);

          .icon {
            svg {
              position: relative;
              margin-top: 10%;
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
      padding: $space-lg;
      margin: $space 0;
    
      &> div {
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
      
      &> div {
        flex: 1;
      }
      
      .btn-square {
        @extend %btn-square;

        height: toRem(225px);
        padding: 3rem 0;
        width: toRem(250px);
        flex-direction: row;
        
        &>div {
          width: 100%;
        }
            
        &:disabled {
          background-color: $grey;
        }

        .aph-icon {
          .fill {
            fill: $dark;
          }
        }

        &:hover {
          background: $purple;
          color: white;

          .aph-icon {
            .fill {
              fill: white;
            }
          }
        }
      }
      
      
      .claim-info {
        background-color: white;
        padding: $space-lg;
        max-height: toRem(300px);
        
        &> div {
         text-align: center;
         text-transform: uppercase;
         font-size: toRem(18px);
         
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
        }
        
        .buttons {
          display: flex;
          flex-direction: row;
          
          
          .btn-square {
            flex: 1;
            margin: $space-lg;
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
