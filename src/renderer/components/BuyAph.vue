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
  </section>
</template>

<script>
export default {
  beforeDestroy() {
    this.$store.commit('setShowPortfolioHeader', true);
  },

  data() {
    return {
      kucoinUrl: 'https://www.kucoin.com/#/?r=7dd6rw',
    };
  },

  mounted() {
    this.$store.commit('setShowPortfolioHeader', false);
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
    margin: 0 auto;
    max-width: toRem(850px);
    padding: 0 $space-xl 0;
    text-align: center;

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
    flex: none;
    width: toRem(500px);

    .link-btn {
      @extend %btn-outline;
    }
  }

}
</style>
