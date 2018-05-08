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
  beforeDestroy() {
    this.$store.state.showPortfolioHeader = true;
  },

  data() {
    return {
      kucoinUrl: 'https://www.kucoin.com/#/?r=7dd6rw',
    };
  },

  mounted() {
    this.$store.state.showPortfolioHeader = false;
  },
};
</script>

<style lang="scss">
#buy-aph {
  align-items: center;
  background-color: $dark-purple;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;

  .icons {
    align-items: center;
    justify-content: center;
    display: flex;

    img {
      height: toRem(150px);
    }

    .icon {
      text-align: center;

      svg {
        &.plus {
          height: toRem(35px);
          margin-top: toRem(50px);
          margin: $space-lg;
        }

        .fill {
          fill: $purple;
        }
      }
    }
  }

  .header {
    color: $purple;
    font-family: GilroySemibold;
    margin-top: $space-xxl;
    text-align: center;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      font-size: toRem(30px);
      margin: 0;

      &:after {
        background: white;
        margin: $space-xl auto;
        width: toRem(200px);
      }
    }
  }

  .body {
    color: white;
    line-height: toRem(20px);
    margin: 0 auto;
    max-width: toRem(850px);
    padding: 0 $space-xl 0;
    text-align: center;

    p {
      line-height: 150%;
      margin: 0;

      & + P {
        margin-top: $space;
      }
    }

    h2 {
      color: $purple;
      margin: $space-xl 0;
      padding: 0;
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
