<template>
  <table class="transactions-table" :class="{'is-clickable': isClickable}">
    <tr v-for="(transaction, index) in transactions" :key="index" @click="handleOnClick(transaction)" :class="[{active: transaction.active}]">
      <td width="40%" class="address truncate" v-if="showBlockTime">{{ transaction.address }}</td>
      <td width="40%" class="address" v-else>{{ transaction.address }}</td>
      <td v-if="showBlockTime">{{ $formatDate(transaction.block_time) }}</td>
      <td class="currency">{{ transaction.symbol }}</td>
      <td width="25%" v-if="transaction.block_time" :class="['amount', {sent: transaction.value < 0, received: transaction.value > 0}]">{{ $formatNumber(transaction.value) }}</td>
      <td width="25%" class="amount" v-else>{{ $formatNumber(transaction.value) }}</td>
    </tr>
  </table>
</template>

<script>
export default {
  computed: {
    isClickable() {
      return _.isFunction(this.onClick);
    },
  },

  methods: {
    handleOnClick(transaction) {
      if (this.onClick) {
        this.onClick(transaction);
      }
    },
  },

  props: {
    onClick: {
      type: Function,
    },

    showBlockTime: {
      default: true,
      type: Boolean,
    },

    transactions: {
      default() {
        return [];
      },
      type: Array,
    },
  },
};
</script>

<style lang="scss">
.transactions-table {
  border-collapse: collapse;
  font-family: GilroySemibold;
  font-size: toRem(12px);
  table-layout: fixed;
  width: 100%;

  td {
    border-top: 1px solid $border-grey;
    padding: $space $space-sm;
    white-space: nowrap;

    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
    }

    &.truncate {
      @include truncate();
    }

    &.currency {
      text-align: center;
    }

    &.amount {
      text-align: right;

      &.received {
        color: $green;

        &:before {
          content: "+";
        }
      }

      &.sent {
        color: $red;
      }
    }
  }

  &.is-clickable {
    tr {
      cursor: pointer;

      td {
        background: transparent;
        transition: $transition;

        &:first-child {
          padding-left: $space;
        }

        &:last-child {
          padding-right: $space;
        }
      }

      &:hover , &.active {
        td {
          background: $background;

          &:not(.amount) {
            color: $purple;
          }
        }
      }
    }
  }
}
</style>


