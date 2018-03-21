<template>
  <div class="recent-transactions">
    <div class="header">
      <h1 class="underlined">Recent transactions</h1>
    </div>
    <div class="body">
      <div class="transaction" @click="viewTransaction">
        <div class="address">0x357da56be0d70bdd44d73b8e0a99f42ebcb02119</div>
        <div class="currency">APH</div>
        <div class="date">25-01-2018</div>
        <div class="amount sent">12,500</div>
      </div>
      <div class="transaction">
        <div class="address">0x357da56be0d70bdd44d73b8e0a99f42ebcb02119</div>
        <div class="currency">APH</div>
        <div class="date">23-01-2018</div>
        <div class="amount sent">6,500</div>
      </div>
      <div class="transaction">
        <div class="address">0x357da56be0d70bdd44d73b8e0a99f42ebcb02119</div>
        <div class="currency">NEO</div>
        <div class="date">23-01-2018</div>
        <div class="amount received">28.3</div>
      </div>
      <div class="transaction">
        <div class="address">0x357da56be0d70bdd44d73b8e0a99f42ebcb02119</div>
        <div class="currency">GAS</div>
        <div class="date">23-01-2018</div>
        <div class="amount sent">5</div>
      </div>
      <div class="transaction">
        <div class="address">0x357da56be0d70bdd44d73b8e0a99f42ebcb02119</div>
        <div class="currency">APH</div>
        <div class="date">23-01-2018</div>
        <div class="amount sent">12,500</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    viewTransaction() {
      const hash = '0x357da56be0d70bdd44d73b8e0a99f42ebcb02119';
      this.$router.push({ path: `/dashboard/trx/${hash}` });
    },
  },
};
</script>

<style lang="scss">
.recent-transactions {
  background: white;
  border-radius: $border-radius;
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
    padding: 0 $space $space;
    overflow: auto;
  }

  .transaction {
    align-items: center;
    border-top: 1px solid $light-grey;
    cursor: pointer;
    display: flex;
    font-family: GilroySemibold;
    font-size: toRem(12px);
    justify-content: space-between;
    padding: $space $space-sm;

    > * {
      flex: 1;
      text-align: center;
      white-space: nowrap;
    }

    .address {
      flex: 1.5;
      overflow: hidden;
      text-align: left;
      text-overflow: ellipsis;
    }

    .amount {
      text-align: right;

      &.received {
        color: $green;

        &:before {
          content: "+";
        }
      }

      &.sent {
        color: $red;

        &:before {
          content: "-";
        }
      }
    }

    &:hover, &.active {
      background: #F9F9FD;
      color: $purple;
    }
  }
}
</style>

