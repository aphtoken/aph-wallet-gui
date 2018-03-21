<template>
  <div class="token-stats">
    <div class="header">
      <h1 class="underlined">Token Stats</h1>
      <div class="current-value">
        <div class="label">Current Value</div>
        <div class="amount">$1.54</div>
      </div>
    </div>
    <div class="body">
      <aph-icon name="logo-mark"></aph-icon>
      <div class="balance">
        <div class="title">Aphelion</div>
        <div class="amount">
          211,414<span class="currency">APH</span>
        </div>
        <div class="value">
          $325,557.56<span class="currency">USD</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="total-supply">
        <div class="label">Total Supply</div>
        <div class="amount">75,000,000</div>
      </div>
      <div class="market-cap">
        <div class="label">Market Cap</div>
        <div class="amount">$254,045,342</div>
      </div>
      <div class="change">
        <div class="label">24h Change</div>
        <div class="amount">+2.77%</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
//
};
</script>

<style lang="scss">
.token-stats {
  background: white;
  border-radius: $border-radius;
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    flex: none;
    padding: $space;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }

    .current-value {
      flex: none;
      text-align: right;

      .amount {
        color: $purple;

        font-family: GilroyMedium;
      }
    }
  }

  .body {
    align-items: center;
    display: flex;
    flex: 1;
    padding: $space;

    .aph-icon {
      padding: 0 $space-lg 0 0;

      svg {
        height: toRem(150px);
      }
    }

    .balance {
      .title {
        color: $purple;
        font-family: GilroyMedium;
        font-size: toRem(23px);
        margin-bottom: $space;
      }

      .amount {
        font-family: GilroyMedium;
        font-size: toRem(38px);
        margin-bottom: $space;

        .currency {
          font-family: Gilroy;
          font-size: toRem(27px);
          margin-left: $space;
        }
      }

      .value {
        font-family: GilroyMedium;
        font-size: toRem(20px);

        .currency {
          margin-left: $space-xsm;
        }
      }
    }
  }

  .footer {
    display: flex;
    flex: none;
    padding: $space;

    > div {
      flex: 1;
    }

    .amount {
      font-family: GilroySemibold;
      font-size: toRem(18px);
    }

    .change {
      color: $green;

      .amount {
        font-family: GilroyMedium;
      }
    }
  }

  .label {
    @extend %small-uppercase-grey-label;

    margin-bottom: $space-sm;
  }
}
</style>


