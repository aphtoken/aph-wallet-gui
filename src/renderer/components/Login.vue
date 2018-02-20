<template>
  <section class="flex align-items-center flex-row full-height">
    <div class="flex-1 flex flex-column align-items-center">
      <aph-icon name="logo"></aph-icon>
      <div class="margin-top-xl margin-bottom-l flex">
        <div class="flex flex-column flex-1 margin-right-s align-items-center login-button padding-bottom-xs padding-top-s">
          <aph-icon class="flex-1" name="wallet"></aph-icon>
          <div class="copy flex-none font-size-xs font-weight-bold color-primary">Login</div>
        </div>
        <div class="flex flex-column flex-1 align-items-center login-button padding-bottom-xs padding-top-s">
          <aph-icon class="flex-1" name="create"></aph-icon>
          <div class="copy flex-none font-size-xs font-weight-bold color-primary">Create Wallet</div>
        </div>
      </div>
      <div class="settings-button font-size-s font-weight-bold">Settings</div>
    </div>
    <div class="flex-1 background-primary-300 full-height">&nbsp;</div>
  </section>
</template>

<script>
export default {
  //
};
</script>

<style lang="scss">
.login-button {
  background: white;
  border-radius: 0;
  border: none;
  box-shadow: 0px 0px 100px 10px rgba(#A75BF6, .25);
  // color: #A75BF6;
  color: var(--primary-100);
  cursor: pointer;
  height: 11rem;
  width: 10rem;

  &:hover {
    // background: #A75BF6;
    // color: white;

    .create--path, .wallet--path {
      fill: white;
    }
  }
}


.right {
  background: black;
}
</style>


