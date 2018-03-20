<template>
  <section id="dashboard">
    <sidebar></sidebar>
    <div class="dashboard--content">
      <router-view name="header"></router-view>
      <div class="dashboard--grid">
        <div class="dashboard--grid--column">
          <div class="dashboard--grid--cell top-left">
            <router-view name="top-left"></router-view>
          </div>
          <div class="dashboard--grid--cell bottom-left">
            <router-view name="bottom-left"></router-view>
          </div>
        </div>
        <div class="dashboard--grid--column">
          <div class="dashboard--grid--cell top-right">
            <router-view name="top-right"></router-view>
          </div>
          <div class="dashboard--grid--cell bottom-right">
            <router-view name="bottom-right"></router-view>
          </div>
        </div>
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
#dashboard {
  display: flex;
  flex-direction: row;

  #dashboard--sidebar {
    flex: none;
    width: 17rem;
  }

  .dashboard--content {
    background: $light-grey;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .dashboard--grid {
    display: flex;
    flex-direction: row;
    flex: 1;
    padding: $space;
  }

  .dashboard--grid--column {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .dashboard--grid--cell {
    display: flex;
    flex-direction: row;
    flex: 1;
    padding: $space;

    > * {
      flex: 1;
    }

    &.top-left {
      flex: none;
    }

    &.bottom-left {
      flex: 1;
    }
  }
}
</style>

