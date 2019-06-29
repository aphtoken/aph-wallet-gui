<template>
  <section id="dashboard">
    <div class="grid">
      <div class="grid--column left">
        <div class="grid--cell">
          <router-view name="left"></router-view>
        </div>
      </div>
      <div class="grid--column">
        <div class="grid--cell right-first">
          <router-view name="right-first"></router-view>
        </div>
        <div class="grid--cell right-second">
          <router-view name="right-second"></router-view>
        </div>
        <div class="grid--cell right-third">
          <router-view name="right-third"></router-view>
        </div>
        <div class="grid--cell right-forth">
          <router-view name="right-forth"></router-view>
        </div>
      </div>
      <!-- <div class="grid--column">
        <div class="grid--cell top-left">
          <router-view name="top-left"></router-view>
        </div>
        <div class="grid--cell bottom-left">
          <router-view name="bottom-left"></router-view>
        </div>
      </div>
      <div class="grid--column">
        <div class="grid--cell top-right">
          <router-view name="top-right"></router-view>
        </div>
        <div class="grid--cell bottom-right">
          <router-view name="bottom-right"></router-view>
        </div>
      </div> -->
    </div>
  </section>
</template>

<script>
export default {
  //
};
</script>

<style lang="scss">
#dashboard {
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow-y: auto;

  .grid {
    display: flex;
    flex-direction: row;
    flex: 1;
    min-height: $dashboard-min-height;
    padding: 0 $space $space;
  }

  .grid--column {
    display: flex;
    flex-direction: column;
    flex: 1 0 50%;

    &:first-child {
      width: 33%;
    }
  }

  .grid--cell {
    flex: 1;

    > * {
      flex: 1;
    }
  }
}

#app {
  &.authenticated-dashboard-send,
  &.authenticated-dashboard-confirming {
    #dashboard {
      .grid {
        .grid--column {
          .grid--cell.top-right {
            flex: none;
          }
        }
      }
    }
  }
}
</style>
