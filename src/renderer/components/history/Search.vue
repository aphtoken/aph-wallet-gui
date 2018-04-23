<template>
  <section id="history--search">
    <div class="header">
      <h1 class="underlined">Search</h1>
    </div>
    <div class="body">
      <aph-select :light="true" :options="dateRanges" :initial-value="dateRanges[0]" v-model="selectedDateRange"></aph-select>
      <div id="search-custom" :class="[{isCustom: selectedDateRange == 'custom'}]">
        <div class="custom-search-label">Custom Search</div>
        <aph-date-picker placeholder="From" v-model="fromDate" ref="fromDate"></aph-date-picker>
        <aph-date-picker placeholder="To" v-model="toDate" ref="toDate"></aph-date-picker>
      </div>
    </div>
  </section>
</template>

<script>
import moment from 'moment';

export default {
  data() {
    return {
      selectedDateRange: 'all',
      dateRanges: [
        {
          label: 'All',
          value: 'all',
        },
        {
          label: 'Last 7 days',
          value: '7',
        },
        {
          label: 'Last 30 days',
          value: '30',
        },
        {
          label: 'Last 90 days',
          value: '90',
        },
        {
          label: 'Custom',
          value: 'custom',
        },
      ],
      fromDate: null,
      toDate: null,
    };
  },

  watch: {
    fromDate() {
      this.$store.commit('setSearchTransactionFromDate', this.fromDate);
      this.$store.dispatch('findTransactions');
    },

    selectedDateRange() {
      if (this.selectedDateRange === 'custom') {
        this.$refs.fromDate.setDay(this.fromDate);
        this.$refs.toDate.setDay(this.toDate);
        return;
      } else if (this.selectedDateRange === 'all') {
        this.fromDate = null;
        this.toDate = null;
        return;
      }

      const daysBack = Number.parseInt(this.selectedDateRange, 10);
      this.fromDate = moment().startOf('day').subtract(daysBack, 'days');
      this.toDate = moment().startOf('day');
    },

    toDate() {
      this.$store.commit('setSearchTransactionToDate', this.toDate);
      this.$store.dispatch('findTransactions');
    },
  },
};
</script>

<style lang="scss">
#history--search {
  @extend %tile-light;

  .header {
    padding: $space-lg $space-lg 0;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    padding: $space-lg;

    .custom-search-label {
      @extend %small-uppercase-grey-label;

      margin: $space-lg 0 $space;
    }

    .aph-date-picker {
      & + .aph-date-picker {
        margin-top: $space;
      }
    }

    #search-custom {
      display: none;

      &.isCustom {
        display: block;
      }
    }
  }
}
</style>


