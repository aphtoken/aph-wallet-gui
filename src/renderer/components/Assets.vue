<template>
  <section id="assets">
    <div class="header">
      <h1 class="underlined">{{$t('assets')}}</h1>
    </div>
    <div class="body">
      <div class="grid">
        <div class="grid--column left">
          <router-view name="left"></router-view>
        </div>
        <div class="grid--column right">
          <div class="add-token" @click="showAddTokenModal">
            <div class="btn-square">
              <aph-icon name="create"></aph-icon>
              <p>{{$t('addToken')}}</p>
            </div>
            <div class="btn-circle">
              <aph-icon name="plus"></aph-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
    <aph-add-token-modal v-if="$store.state.showAddTokenModal" :onCancel="hideAddTokenModal"></aph-add-token-modal>
  </section>
</template>

<script>
import AphAddTokenModal from './modals/AddTokenModal';

export default {
  components: {
    AphAddTokenModal,
  },

  methods: {
    hideAddTokenModal() {
      this.$store.commit('setShowAddTokenModal', false);
    },

    showAddTokenModal() {
      this.$store.commit('setShowAddTokenModal', true);
    },
  },
};
</script>

<style lang="scss">
#assets {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;

  .header {
    padding: $space-lg $space-lg 0;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .body {
    height: 90%;
    position: relative;

    .grid {
      display: flex;
      flex-direction: row;
      flex: 1;
      padding: $space-lg;
      height: 100%;
    }

    .grid--column {
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

            height: auto;
            padding: 3rem 0;
            width: toRem(250px);

            .aph-icon {
              margin-bottom: $space;

              .fill {
                fill: $dark;
              }
            }

            &:hover {
              background: white;
              color: $purple;

              .aph-icon {
                .fill {
                  fill: $dark;
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

          &:hover {
            .btn-circle {
              box-shadow: $box-shadow-sm;
            }
          }
        }
      }
    }
  }
}
</style>


