<template>
  <section id="history--table">
    <div class="header">
      <div class="cell">Date</div>
      <div class="cell">Token</div>
      <div class="cell">Amount</div>
      <div class="cell">Total</div>
      <div class="cell status">Status</div>
    </div>
    <div class="body">
      <div class="transaction" v-for="(transaction, index) in transactions" :key="index">
        <div class="cell date">{{ $formatDate(transaction.timestamp) }}</div>
        <div class="cell token">{{ transaction.symbol }}</div>
        <div :class="['cell', 'amount', {decrease: transaction.amount < 0, increase: transaction.amount > 0}]">{{ $formatNumber(transaction.amount) }}</div>
        <div class="cell total">{{ $formatMoney(transaction.value) }}</div>
        <div class="cell status">
          <aph-icon name="confirmed" v-if="transaction.confirmed"></aph-icon>
          <aph-icon name="unconfirmed" v-else></aph-icon>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      transactions: [
        {
          amount: -152258,
          confirmed: true,
          symbol: 'APH',
          timestamp: 216546846,
          value: 23578.52,
        },
        {
          amount: 24.5,
          confirmed: false,
          symbol: 'NEO',
          timestamp: 2165464657,
          value: 532.11,
        },
      ],
    };
  },
};
</script>


<style lang="scss">
#history--table {
  @extend %tile-light;
  padding: $space;

  .header {
    display: flex;
    padding: 0;

    .cell {
      @extend %small-uppercase-grey-label;

      flex: 1;
      padding: $space;

      &.status {
        flex: none;
        text-align: center;
        width: toRem(100px);
      }
    }
  }

  .body {
    .transaction {
      align-items: center;
      background: transparent;
      border-top: 1px solid $light-grey;
      cursor: pointer;
      display: flex;
      transition: $transition;

      .cell {
        flex: 1;
        font-family: GilroySemibold;
        padding: $space;

        .aph-icon {
          svg {
            height: toRem(30px);
          }
          .confirmed {
            .stroke {
              stroke: $green;
              stroke-width: 1.8;
            }
          }
          .unconfirmed {
            .fill {
              fill: $red;
            }
            .stroke {
              stroke: $red;
            }
          }
        }

        &.increase {
          color: $green;

          &:before {
            content: "+";
          }
        }

        &.decrease {
          color: $red;
        }

        &.status {
          flex: none;
          text-align: center;
          width: toRem(100px);
        }
      }

      &:hover, &.active {
        background: $light-grey;
        color: $purple;
      }
    }
  }
}
</style>

