<template>
  <section id="buy-aph">
    <div class="buy-aph-wrapper">
      <div class="icons">
        <img src="~@/assets/img/token-icons/APH.png">
        <span class="icon">
          <aph-icon name="plus"></aph-icon>
        </span>
        <img src="~@/assets/img/Kucoin_icon.svg" />
      </div>
      <div class="header">
        <h1 class="underlined">{{$t('nowListedOnKucoin')}}</h1>
      </div>
      <div class="body">
        <p>
          {{$t('comingSoon')}}
        </p>
        <p>
          {{$t('tradesWillBePoweredBy')}}
        </p>
        <h2>{{$t('getYourAPHTokens')}}</h2>
      </div>
      <div class="footer">
        <a class="link-btn" :href="kucoinUrl" :title="$t('openKucoinInBrowser')" target="_blank">{{$t('buyNow')}}</a>
      </div>
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
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;

  .buy-aph-wrapper {
    flex: 0 0 auto;
    padding: $space-xl;
    display: flex;
    flex-direction: column;
    margin: auto;
  }

  .icons {
    align-items: center;
    justify-content: center;
    display: flex;
    flex: 0 0 auto;

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
    flex: 0 0 auto;

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
    margin: 0 auto;
    max-width: toRem(850px);
    padding: 0 $space-xl 0;
    text-align: center;
    flex: 0 0 auto;

    p {
      color: white;
      line-height: $copy-line-height;
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
    flex: 0 0 auto;
    width: toRem(500px);
    margin-left: auto;
    margin-right: auto;

    .link-btn {
      @extend %btn-outline;
    }
  }

}
</style>
