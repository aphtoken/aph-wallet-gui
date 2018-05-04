<template>
  <div id="zoom">
    <div class="control up" @click="zoomIn">
      <aph-icon name="plus"></aph-icon>
    </div>
    <div class="control reset" @click="reset">
      <aph-icon name="reset"></aph-icon>
    </div>
    <div class="control down" @click="zoomOut">
      <aph-icon name="minus"></aph-icon>
    </div>
  </div>
</template>

<script>
import { webFrame } from 'electron';

export default {
  methods: {
    reset() {
      webFrame.setZoomFactor(1);
    },

    zoomIn() {
      webFrame.setZoomFactor(webFrame.getZoomFactor() + 0.1);
    },

    zoomOut() {
      webFrame.setZoomFactor(webFrame.getZoomFactor() - 0.1);
    },
  },
};
</script>

<style lang="scss">
#zoom {
  align-items: center;
  background: darken($background, 5%);
  border-radius: $border-radius;
  display: flex;
  flex-direction: column;

  > .control {
    cursor: pointer;
    flex: 1;
    padding: $space toRem(20px);
    transition: $transition;

    > .aph-icon {
      svg {
        height: toRem(17px);
      }
    }

    &:hover {
      > .aph-icon {
        .plus, .minus {
          .fill {
            fill: $purple;
          }
        }
      }
    }
  }
}
</style>


