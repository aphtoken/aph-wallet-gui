<template>
  <div class="holdings">
    <div class="header">
      <h1 class="underlined">My holdings</h1>
    </div>
    <div class="body">
      <div class="holding active">
        <div class="token-icon">
          <aph-icon name="logo-mark"></aph-icon>
        </div>
        <div class="token">
          <div class="name">Aphelion</div>
          <div class="currency">APH</div>
        </div>
        <div class="balance">
          <div class="amount">
            211,414<span class="currency">APH</span>
          </div>
          <div class="change increase">2.77</div>
        </div>
      </div>
      <div class="holding">
        <div class="token-icon">
          <img src="~@/assets/img/token-icons/neo-logo.png" alt="">
        </div>
        <div class="token">
          <div class="name">Neo</div>
          <div class="currency">NEO</div>
        </div>
        <div class="balance">
          <div class="amount">
            324<span class="currency">NEO</span>
          </div>
          <div class="change decrease">0.43</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {

};
</script>

<style lang="scss">
.holdings {
  display: flex;
  flex-direction: column;

  .header {
    padding: $space;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    .holding {
      align-items: center;
      background: white;
      border-left: 3px solid transparent;
      border-radius: $border-radius;
      display: flex;
      padding: $space;

      .token-icon {
        flex: none;
        padding-right: $space;

        img, svg {
          width: $space * 3;
        }
      }

      .token {
        flex: 1;

        .name {
          font-family: GilroySemiBold;
          margin-bottom: $space-sm;
        }

        .currency {
          @extend %small-uppercase-grey-label;
        }
      }

      .balance {
        flex: 1;
        font-family: GilroyMedium;
        text-align: right;

        .amount {
          margin-bottom: $space-sm;

          .currency {
            margin-left: $space-xsm;
          }
        }

        .change {
          font-size: $font-size-sm;

          &.increase {
            color: $green;

            &:before {
              content: "+";
            }

            &:after {
              content: "%";
              margin-left: $space-xsm;
            }
          }

          &.decrease {
            color: $red;

            &:before {
              content: "-";
            }
          }

          &:after {
            content: "%";
            margin-left: $space-xsm;
          }
        }
      }

      &.active {
        border-color: $purple;
      }

      & + .holding {
        margin-top: $space;
      }
    }
  }
}
</style>

