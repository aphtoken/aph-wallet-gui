<template>
  <section id="portfolio-header" v-if="$store.state.portfolio">
    <simple-donut :percent="$store.state.portfolio.changePercent"></simple-donut>
    <div class="ticker">
      <h1 class="underlined">{{$t('myPortfolio')}}</h1>
      <div class="balance">
        <span class="amount">{{ $formatMoney($store.state.portfolio.balance) }}</span><span class="currency">{{ $store.state.currency }}</span>
      </div>
      <div class="change">
        <div class="label">{{$t('twentyFourHourChange')}}</div>
        <div :class="['amount', {increase: $store.state.portfolio.changeValue > 0, decrease: $store.state.portfolio.changeValue < 0}]">{{ $formatMoney($store.state.portfolio.changeValue) }}</div>
      </div>
    </div>
    <div class="btn-group">
      <div class="receive-btn" @click="showSendAddressModal">
        <aph-icon name="receive"></aph-icon>
        <p>{{$t('receive')}}</p>
      </div>
      <div class="send-btn" @click="showSendView">
        <aph-icon name="send"></aph-icon>
        <p>{{$t('send')}}</p>
      </div>
    </div>
    <zoom></zoom>
    <address-modal v-if="$store.state.showSendAddressModal" :address="getCurrentWalletAddress()" :onDone="hideSendAddressModal"></address-modal>
  </section>
  <section v-else></section>
</template>

<script>
import AddressModal from './modals/AddressModal';
import SimpleDonut from './charts/SimpleDonut';
import Zoom from './Zoom';

export default {
  components: {
    AddressModal,
    SimpleDonut,
    Zoom,
  },

  methods: {
    getCurrentWalletAddress() {
      return this.$services.wallets.getCurrentWallet().address;
    },

    hideSendAddressModal() {
      this.$store.commit('setShowSendAddressModal', false);
    },

    showSendAddressModal() {
      this.$store.commit('setShowSendAddressModal', true);
    },

    showSendView() {
      this.$router.push(`/authenticated/dashboard/${this.$store.state.sendInProgress ? 'confirming' : 'send'}`);
    },
  },
};
</script>

<style lang="scss">
#portfolio-header {
  align-items: center;
  display: flex;
  flex-direction: row;
  flex: none;
  padding: $space-lg $space-lg $space;

  .simple-donut {
    margin: 0 $space-xl 0 0;
    height: toRem(150px);
  }

  #zoom {
    align-self: flex-start;
    margin-left: $space-lg;
  }

  .btn-group {
    display: flex;
    flex-direction: row;
    flex: none;
    width: $right-column-width;

    > * {
      width: auto;
      flex: 1;
    }
  }

  .ticker {
    flex: 1;

    h1.underlined {
      @extend %underlined-header;
    }

    .balance {
      .amount {
        font-size: toRem(45px);
        margin: 0 $space 0 0;
      }

      .currency {
        font-size: toRem(30px);
      }
    }

    .change {
      align-items: center;
      display: flex;
      margin-top: $space;

      .label {
        @extend %small-uppercase-grey-label-dark;
      }

      .amount {
        font-size: toRem(16px);
        margin-left: $space;

        &.increase {
          color: $green;

          &:before {
            content: "+";
            }
        }

        &.decrease {
          color: $red;
        }
      }
    }
  }

  .receive-btn, .send-btn {
    @extend %btn-square;

    height: toRem(160px);

    .aph-icon {
      .fill {
        fill: $dark;
      }
    }
  }

  .send-btn {
    background: $purple;
    margin-left: $space-lg;

    &:hover {
      box-shadow: $box-shadow-lg;
    }

    p {
      color: white;
    }
  }
}
</style>


