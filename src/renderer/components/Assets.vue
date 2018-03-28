<template>
  <section id="assets">
    <sidebar></sidebar>
    <div class="assets--content">
      <router-view name="header"></router-view>
      <div class="assets--grid">
        <div class="assets--grid--column left">
          <router-view name="left"></router-view>
        </div>
        <div class="assets--grid--column right">right</div>
      </div>
    </div>
  </section>
</template>

<script>
import Sidebar from './Sidebar';

export default {
  components: {
    Sidebar,
  },
};
</script>

<style lang="scss">
#assets {
  display: flex;
  flex-direction: row;

  #dashboard--sidebar {
    flex: none;
    width: toRem(300px);
  }

  .assets--content {
    background: $light-grey;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .assets--grid {
    display: flex;
    flex-direction: row;
    flex: 1;
    padding: $space;
  }

  .assets--grid--column {
    display: flex;
    flex-direction: column;
    flex: 1;

    &.right {
      flex: none;
    }
  }

  // .assets--grid--cell {
  //   display: flex;
  //   flex-direction: row;
  //   flex: 1;
  //   padding: $space;

  //   > * {
  //     flex: 1;
  //   }

  //   &.top-left {
  //     flex: none;
  //   }

  //   &.bottom-left {
  //     flex: 1;
  //   }
  // }
}
</style>


