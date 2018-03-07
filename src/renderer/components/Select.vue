<template>
  <div class="aph-select">
    <v-select v-bind="$props"></v-select>
  </div>
</template>

<script>
import vSelect from 'vue-select';

export default {
  components: {
    vSelect,
  },

  props: [
    'clearSearchOnSelect',
    'clearable',
    'closeOnSelect',
    'createOption',
    'dir',
    'disabled',
    'filter',
    'filterBy',
    'filterable',
    'getOptionLabel',
    'inputId',
    'maxHeight',
    'multiple',
    'noDrop',
    'onChange',
    'options',
    'placeholder',
    'pushTags',
    'resetOnOptionsChange',
    'searchable',
    'tabindex',
    'taggable',
    'transition',
    'value',
  ],
};
</script>

<style lang="scss">

</style>
