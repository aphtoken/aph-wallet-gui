<template>
  <table class="transactions-table" :class="{'is-clickable': isClickable}">
    <thead>
      <tr>
        <th v-if="showStatus" class="status">Status</th>
        <th>Currency</th>
        <th v-if="showBlockTime">When</th>
        <th>Address</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(transaction, index) in transactions" :key="index" @click="handleOnClick(transaction)" :class="[{active: transaction.active}]">
        <td v-if="showStatus" class="status">
          <aph-icon name="confirmed" v-if="transaction.details.confirmed"></aph-icon>
          <aph-icon name="unconfirmed" v-else></aph-icon>
        </td>
        <td class="currency">{{ transaction.symbol }}</td>
        <td v-if="showBlockTime">{{ $formatDate(transaction.block_time) }}</td>
        <td width="50%" class="address truncate" v-if="showBlockTime">{{ transaction.address }}</td>
        <td width="50%" class="address" v-else>{{ transaction.address }}</td>
        <td v-if="transaction.block_time" :class="['amount', {sent: transaction.value < 0, received: transaction.value > 0}]">{{ $formatNumber(transaction.value) }}</td>
        <td class="amount" v-else>{{ $formatNumber(transaction.value) }}</td>
      </tr>
    </tbody>
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

    showStatus: {
      default: false,
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
  font-family: Proxima;
  // font-size: toRem(12px);
  table-layout: fixed;
  width: 100%;

  th {
    background: $light-grey;
    padding: $space;
    color: $dark-grey;
    text-align: left;

    &:first-child {
      border-top-left-radius: $border-radius;
      border-bottom-left-radius: $border-radius;
    }

    &:last-child {
      border-top-right-radius: $border-radius;
      border-bottom-right-radius: $border-radius;
      text-align: right;
    }

    &.status {
      text-align: center;
    }
  }

  td {
    border-top: toRem(1px) solid $border-grey;
    padding: $space;
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

    &.status {
      text-align: center;

      .aph-icon {
        svg {
          height: toRem(14px);

          &.confirmed {
            .fill {
              fill: $green !important;
            }
          }

          &.unconfirmed {
            .fill {
              fill: $red !important;
            }
          }
        }
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
