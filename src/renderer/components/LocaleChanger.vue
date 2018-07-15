<template>
  <div class="locale-changer">
    <select v-model="locale">
      <option v-for="(lang, i) in langs" :key="`Lang${i}`" :value="lang">{{ lang }}</option>
    </select>
  </div>
</template>

<script>
  export default {
    name: 'locale-changer',
    data() {
      return {
        langs: [],
        locale: this.$i18n.locale,
      };
    },
    mounted() {
      this.langs = this.$constants.langs;
    },
    watch: {
      locale(lang) {
        this.$i18n.locale = lang;
        localStorage.setItem('lang', lang);
      },
    },
  };
</script>

<style lang="scss">
  .locale-changer {
    margin: $space 0;
  }
</style>


