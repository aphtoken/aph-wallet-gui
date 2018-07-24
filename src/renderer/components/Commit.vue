<template>
  <section id="commit-aph">
    <div class="header">
      <!-- todo: move text to language files-->
      <h1>{{$t('commit')}} APH</h1>
      <button class="learn-more" @click="showInfo">Learn more</button>
    </div>
    <div class="body" v-if="$store.state.commitState">
      <div class="exchange-values">
        <div class="total">
          <span class="icon">
            <aph-icon name="award"></aph-icon>
          </span>
          <div>
            <div>Total fees collected by DEX for contributors</div>
            <div>{{$formatNumber($store.state.commitState.totalFeesCollected)}} APH</div>
            <div>Estimated USD {{feesWhenCommittedEstimate}}</div>
          </div>
        </div>
        <div class="at-commit">
          <span class="icon">
            <aph-icon name="hex"></aph-icon>
            <aph-icon name="star"></aph-icon>
          </span>
          <div>
            <div>Total fees collected at time of commitment</div>
            <div>{{$formatNumber($store.state.commitState.feesCollectedSnapshot)}} APH</div>
            <div>Estimated USD {{feesWhenCommittedEstimate}}</div>
          </div>
        </div>
        <div class="since-commit">
          <span class="icon">
            <aph-icon name="hex"></aph-icon>
            <aph-icon name="star"></aph-icon>
          </span>
          <div>
            <div>Total fees collected since committed</div>
            <div>{{$formatNumber($store.state.commitState.feesCollectedSinceCommit)}} APH</div>
            <div>Estimated USD {{feesWhenCommittedEstimate}}</div>
          </div>
        </div>
      </div>
      <div class="user-values">
        <div class="value">
          <h2 class="underlined">Amount Committed</h2>
          <div class="highlight">{{$formatNumber($store.state.commitState.quantityCommitted)}} APH</div>
          <div><span>Estimated (USD)</span>{{feesWhenCommittedEstimate}}</div>
        </div>
        <div class="date">
          <h2 class="underlined">Date Committed</h2>
          <div class="highlight">{{$formatDate($store.state.commitState.contributionTimestamp)}}</div>
          <div>
            <span>Time</span>{{$formatTime($store.state.commitState.contributionTimestamp)}}
            <span>Block</span>{{$store.state.commitState.contributionHeight}}
          </div>
        </div>
        <div class="weight">
          <h2 class="underlined">My Weight</h2>
          <div class="highlight">{{$formatNumber($store.state.commitState.weightPercentage)}}</div>
          <div><span>My Weight</span>{{$formatNumber($store.state.commitState.userWeight)}}</div>
          <div><span>Network Weight</span>{{$formatNumber($store.state.commitState.networkWeight)}}</div>
        </div>
        <div class="earned">
          <h2 class="underlined">Fees Earned</h2>
          <div class="highlight">{{availableToClaim}} APH</div>
          <div>Estimated USD {{feesWhenCommittedEstimate}}</div>
        </div>
      </div>
      <div class="actions">
        <div class="commit">
          <div class="btn-square" @click="commit()">
            <aph-icon name="commit"></aph-icon>
            <p>{{$t('commit')}}</p>
          </div>
        </div>
        <div class="claim-info">
          <div class="value">
            <h2>{{availableToClaim}}</h2>
            <div>Blocks ({{blocksSinceCommitted}})</div>
            <div>Current Block <span>{{ currentBlock }}</span></div>
          </div>
          <div class="buttons">
            <div class="btn-square" @click="claim()">
              <aph-icon name="claim"></aph-icon>
              <p>{{$t('claim')}}</p>
            </div>
            <div class="btn-square" @click="compound()">
              <aph-icon name="compound"></aph-icon>
              <p>Compound</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <commit-info v-if="!$store.state.acceptCommitInfo"></commit-info>
  </section>
</template>

<script>
import { BigNumber } from 'bignumber.js';
import { mapGetters } from 'vuex';
import CommitInfo from './modals/CommitInfo';

export default {
  components: {
    CommitInfo,
  },

  beforeDestroy() {
    this.$store.state.showPortfolioHeader = true;
  },

  mounted() {
    this.$store.state.showPortfolioHeader = false;
    this.$store.dispatch('fetchCommitState');
  },

  data() {
    return {
      amountToCommit: '3',
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
    currentBlock() {
      return this.currentNetwork && this.currentNetwork.bestBlock ? this.currentNetwork.bestBlock.index : 0;
    },
    blocksSinceCommitted() {
      if (this.blockCommitted <= 0) {
        return 0;
      }
      return this.currentBlock - this.blockCommitted;
    },
  },

  methods: {
    showInfo() {
      this.$store.commit('setAcceptCommitInfo', false);
    },
    commit() {
      this.$services.dex.commitAPH(new BigNumber(this.amountToCommit).toNumber());
    },
    claim() {
      this.$services.dex.claimAPH();
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
    margin: $space;

    h1 {
      display: inline-block;
      font-size: toRem(35px);
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
        
      &> div {
        display: flex;
        flex-direction: row;
        flex: 1;
        max-width: toRem(500px);
        margin: $space;
        
        &> div {
          display: flex;
          flex-direction: column;  
      
          .icon {
            flex: 1;
          }      
        }
      }
      
      
      .icon {
        position: relative;
        svg {
          position: absolute;
          left: 50%;
          top: 0;
          
          &.hex {
            margin: toRem(-14px);
            height: toRem(75px);
            width: toRem(75px);
            .fill {
              fill: $grey;
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

        height: auto;
        padding: 3rem 0;
        width: toRem(250px);

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
        
        &> div {
         text-align: center; 
        }
        
        .buttons {
          display: flex;
          flex-direction: row;
          transform: translate(0%, 50%);
          
          
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
