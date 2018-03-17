<template>
  <section id="dashboard">
    <sidebar></sidebar>
    <div class="dashboard-content">
      <router-view></router-view>
    </div>
  </section>
</template>

<script>
import Sidebar from './dashboard/Sidebar';

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

  .dashboard-content {
    flex: 1;
  }
}
</style>

