<template>
  <div class="locale-changer">
    <select v-model="$i18n.locale">
      <option v-for="(lang, i) in langs" :key="`Lang${i}`" :value="lang">{{ lang }}</option>
    </select>
  </div>
</template>

<script>
  import { langs } from '../constants';
  export default {
    name: 'locale-changer',
    data() {
      return {
        langs,
      };
    },
  };
</script>

<style lang="scss">
  .locale-changer {
    margin: $space 0;
  }
</style>


