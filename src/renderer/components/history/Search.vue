<template>
  <div id="history--search">
    <div class="header">
      <h1 class="underlined">Search</h1>
    </div>
    <div class="body">
      <aph-select :light="true" :options="dateRanges" :initial-value="dateRanges[0]"></aph-select>
      <div class="custom-search-label">Custom Search</div>
      <aph-date-picker placeholder="From" v-model="fromDate"></aph-date-picker>
      <aph-date-picker placeholder="To" v-model="toDate"></aph-date-picker>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dateRanges: [
        {
          label: 'All',
          value: null,
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
      ],
      fromDate: null,
      toDate: null,
    };
  },
};
</script>

<style lang="scss">
#history--search {
  @extend %tile-light;

  .header {
    padding: $space;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    padding: $space;

    .custom-search-label {
      @extend %small-uppercase-grey-label;

      margin: $space-lg 0 $space;
    }

    .aph-date-picker {
      & + .aph-date-picker {
        margin-top: $space;
      }
    }
  }
}
</style>


