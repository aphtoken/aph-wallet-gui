@@ -0,0 +1,129 @@
<template>
  <section id="buy-aph">
    <div class="icons">
      <img src="~@/assets/img/token-icons/APH.png">
      <span class="icon">
        <aph-icon name="plus"></aph-icon>
      </span>
      <img src="~@/assets/img/Kucoin_icon.svg" />
    </div>
    <div class="header">
      <h1 class="underlined">APH Tokens Now Listed On Kucoin!</h1>
    </div>
    <div class="body">
      <p>
        Coming Soon: Aphelion DEX is a fully integrated, wallet based peer-to-peer decentralized trading
        solution that will be updated directly into this wallet in a future release.
      </p>
      <p>
        Trades will be powered by APH tokens to be redistributed to all APH token holders via the Aphelion
        Decentralized Exchange Asset Ledger (D.E.A.L) smart contract.
      </p>
      <h2>Get Your APH Tokens Here</h2>
    </div>
    <div class="footer">
      <a class="link-btn" :href="kucoinUrl" title="Open Kucoin in your browser" target="_blank">Buy Now</a>
    </div>
  </section>
</template>

<script>
export default {
  mounted() {
    this.$store.state.showPortfolioHeader = false;
  },
  beforeDestroy() {
    this.$store.state.showPortfolioHeader = true;
  },
  data() {
    return {
      kucoinUrl: 'https://www.kucoin.com/#/?r=7dd6rw',
    };
  },
};
</script>

<style lang="scss">
#buy-aph {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  background-color: $dark-purple;
  
  .icons {  
    display: flex;
    max-width: 600px;
    margin: toRem(200px) auto $space auto;
    
    img {
      height: toRem(125px);
      flex: 1;
    }
    .icon {
      flex: 1;
      text-align: center;

      svg {
        &.plus {
          height: toRem(35px);  
          margin: $space-lg;
          margin-top: toRem(50px);
        }
        .fill {
          fill: $purple;
        }
      }
    }
  }
  
  .header {
    color: $purple;
    text-align: center;
    font-family: GilroySemibold;
    padding: $space;
    
    h1.underlined {
      @extend %underlined-header;
      flex: 1;
      margin-bottom: 0;
      font-size: toRem(30px);
      
      &:after {
        background: white;
        width: toRem(200px);
        margin: $space-lg auto;
      }
    }
  }
  
  .body {
    padding: 0 $space-lg 0;
    max-width: toRem(800px);
    margin: $space auto;
    text-align: center;
    color: white;
    line-height: toRem(20px);
    
    h2 {
      color: $purple;
      margin: $space-lg 0 0 0;
      padding: 0;
    }
  }

  .footer {
    display: flex;
    flex: none;
    flex-direction: row;
    width: toRem(500px);
    margin: $space auto;
    > * {
      flex: 1;
    }
    .link-btn {
      @extend %btn-outline;
    }
  }
  
}
</style>
