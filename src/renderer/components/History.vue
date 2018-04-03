<template>
  <section id="history">
    <div class="header">
      <h1 class="underlined">History</h1>
    </div>
    <div class="grid">
      <div class="grid--column left">
        <router-view name="left"></router-view>
      </div>
      <div class="grid--column right">
        <search></search>
      </div>
    </div>
  </section>
</template>

<script>
import Search from './history/Search';

export default {
  components: {
    Search,
  },
};
</script>

<style lang="scss">
#history {
  display: flex;
  flex-direction: column;
  flex: 1;

  .header {
    padding: $space-lg $space-lg 0;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .content {
    background: $light-grey;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .grid {
    display: flex;
    flex-direction: row;
    flex: 1;
    padding: $space-lg;
  }

  .grid--column {
    display: flex;
    flex-direction: column;
    flex: 1;

    &.right {
      flex: none;
      margin-left: $space-lg;
      width: $right-sidebar-width;

      .add-token {
        position: relative;

        .btn-square {
          @extend %btn-square;

          box-shadow: $box-shadow;
          cursor: default;
          padding-bottom: $space-xl;
          width: toRem(250px);

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


