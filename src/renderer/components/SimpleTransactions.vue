<template>
  <table class="transactions-table" :class="{'is-clickable': isClickable}">
    <tr v-for="(transaction, index) in transactions" :key="index" @click="handleOnClick(transaction)" :class="[{active: transaction.active}]">
      <td width="50%" class="address truncate" v-if="showBlockTime" :title="transaction.address">{{ transaction.address }}</td>
      <td width="50%" class="address" v-else :title="transaction.address">{{ transaction.address }}</td>
      <td v-if="showBlockTime">{{ $formatDate(transaction.block_time) }}</td>
      <td class="currency">{{ transaction.symbol }}</td>
      <td v-if="transaction.block_time" :class="['amount truncate', {sent: transaction.value < 0, received: transaction.value > 0}]" :title="transaction.value">{{ $formatNumber(transaction.value) }}</td>
      <td width="25%" class="amount truncate" :title="transaction.value" v-else>{{ $formatNumber(transaction.value) }}</td>
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
    border-top: toRem(1px) solid $border-grey;
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
        @include transition(background-color);

        background-color: transparent;

        &:first-child {
          padding-left: $space;
        }

        &:last-child {
          padding-right: $space;
        }
      }

      &:hover , &.active {
        td {
          background-color: $background;

          &:not(.amount) {
            color: $purple;
          }
        }
      }
    }
  }
}
</style>
