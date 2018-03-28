<template>
  <section id="assets">
    <sidebar></sidebar>
    <div class="assets--content">
      <router-view name="header"></router-view>
      <div class="header">
        <h1 class="underlined">Assets</h1>
      </div>
      <div class="assets--grid">
        <div class="assets--grid--column left">
          <router-view name="left"></router-view>
        </div>
        <div class="assets--grid--column right">
          <div class="add-token">
            <div class="btn-square">
              <aph-icon name="create"></aph-icon>
              <p>Add token</p>
            </div>
            <div class="btn-circle">
              <aph-icon name="show"></aph-icon>
            </div>
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
#assets {
  display: flex;
  flex-direction: row;

  .header {
    padding: $space-lg $space-lg 0;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

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
    padding: $space-lg;
  }

  .assets--grid--column {
    display: flex;
    flex-direction: column;
    flex: 1;

    &.right {
      flex: none;
      margin-left: $space-lg;

      .add-token {
        position: relative;

        .btn-square {
          @extend %btn-square;

          cursor: default;
          padding-bottom: $space-xl;
          width: toRem(250px);

          > p {

          }

          .aph-icon {
            .fill {
              fill: $dark;
            }
          }

          &:hover {
            background: white;
            color: $dark;

            .aph-icon {
              .fill {
                fill: $purple;
              }
            }
          }
        }

        .btn-circle {
          @extend %btn-circle;

          left: 50%;
          position: absolute;
          top: 100%;
          transform: translate(-50%, -50%);
        }
      }
    }
  }
}
</style>


