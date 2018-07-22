<template>
  <section id="commit-aph">
    <div class="header">
      <!-- todo: move text to language files-->
      <h1>{{$t('commit')}} APH</h1>
      <button class="learn-more">Learn more</button>
    </div>
    <div class="body">
      <div class="exchange-values">
        <div class="at-commit">
          <span class="icon">
            <aph-icon name="dex"></aph-icon>
          </span>
          <div>
            <div>Total fees collected at time of commitment</div>
            <div>{{feesWhenCommitted}} APH</div>
            <div>Estimated USD {{feesWhenCommittedEstimate}}</div>
          </div>
        </div>
        <div class="total">
          <span class="icon">
            <aph-icon name="dex"></aph-icon>
          </span>
          <div>
            <div>Total fees collected by DEX for contributors</div>
            <div>{{totalFeesCollected}} APH</div>
            <div>Estimated USD {{feesWhenCommittedEstimate}}</div>
          </div>
        </div>
      </div>
      <div class="user-values">
        <div class="value">
          <h2 class="underlined">Amount Committed</h2>
          <div>{{aphCommitted}} APH</div>
          <div>Estimated USD {{feesWhenCommittedEstimate}}</div>
        </div>
        <div class="date">
          <h2 class="underlined">Date Committed</h2>
          <div>{{dateCommitted}} APH</div>
          <div>Estimated USD {{feesWhenCommittedEstimate}}</div>
        </div>
        <div class="available">
          <h2 class="underlined">Available to Claim</h2>
          <div>{{availableToClaim}} APH</div>
          <div>Estimated USD {{feesWhenCommittedEstimate}}</div>
        </div>        
      </div>
      <div class="actions">
        <div class="commit">
          <div class="btn-square" @click="commit()">
            <aph-icon name="create"></aph-icon>
            <p>{{$t('commit')}}</p>
          </div>
        </div>
        <div class="claim">
          <div class="value">
            <h2>{{availableToClaim}}</h2>
            <div>Blocks ({{blocksSinceCommitted}})</div>
            <div>Current Block <span>{{ currentBlock }}</span></div>
          </div>
          <div class="buttons">
            <div class="btn-square" @click="claim()">
              <aph-icon name="create"></aph-icon>
              <p>{{$t('claim')}}</p>
            </div>
            <div class="btn-square" @click="compound()">
              <aph-icon name="create"></aph-icon>
              <p>Compound</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { BigNumber } from 'bignumber.js';
import { mapGetters } from 'vuex';

export default {
  beforeDestroy() {
    this.$store.state.showPortfolioHeader = true;
  },

  mounted() {
    this.$store.state.showPortfolioHeader = false;
  },

  data() {
    return {
      amountToCommit: '',
      feesWhenCommitted: 0,
      totalFeesCollected: 0,
      aphCommitted: 0,
      dateCommitted: 0,
      availableToClaim: 0,
      blockCommitted: 0,
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
          margin-bottom: $space;

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
      
      
      .claim {
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
