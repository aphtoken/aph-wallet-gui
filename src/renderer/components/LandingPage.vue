<template>
  <div id="wrapper" class="full-height">
    <!-- <img id="logo" src="~@/assets/logo.png" alt="electron-vue"> -->
    <main class="full-height padding-xl flex flex-column align-items-center justify-content-center">
        <div class="flex-none">
          <img src="~@/assets/img/logo-md.png">
        </div>
        <h1 class="color-secondary flex-none text-center">Aphelion Desktop Wallet</h1>
    </main>
  </div>
</template>

<script>
  export default {
    name: 'landing-page',

    methods: {
      open(link) {
        this.$electron.shell.openExternal(link);
      },
    },
  };
</script>

<style>
</style>
