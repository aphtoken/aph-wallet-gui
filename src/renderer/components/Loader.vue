<template>
  <div v-if="isPending" :style="{'width': $parent.$el.clientWidth + 'px', 'height': $parent.$el.clientHeight + 'px'}" class="loader-container">
    <div  class="loader loader--fade">
      <span class="loader-item">1</span>
      <span class="loader-item">2</span>
      <span class="loader-item">3</span>
      <span class="loader-item">4</span>
      <span class="loader-item">5</span>
      <span class="loader-item">6</span>
    </div>
  </div>
</template>

<script>
import { requests } from '../constants';

export default {

  mounted() {
    // console.log(this.$parent);
  },

  computed: {
    isPending() {
      const request = this.$store.state.requests[this.identifier];

      if (request && request.status && request.status === requests.PENDING && !this.completed) {
        if (this.once) {
          this.completed = true;
        }

        return true;
      }

      return false;
    },
  },

  data() {
    return {
      completed: false,
    };
  },

  methods: {
  },

  props: {
    identifier: {
      default: null,
      type: String,
    },
    once: {
      default: true,
      type: Boolean,
    },
  },
};
</script>

<style lang="scss">
$itemSize : 10;
$itemSpacing : 2;
$squareSize : 40;
$loaderColor : rgba(117, 43, 247, 0.7);
$loaderDelay : 100;
$loaderDuration : 2000;
$animationTiming: cubic-bezier(.645, .045, .355, 1);

.loader-container {
  position: absolute;
  text-align: center;

  .loader {
    display: block;
    overflow: hidden;
    font-size: 0;
    position: absolute;
    top:50%;
    width: 100%;
  }
}

.loader-item {
  display: inline-block;
  width: $itemSize + px;
  height: $itemSize + px;
  margin-left: $itemSpacing + px;
  background-color: $loaderColor;
  color: $loaderColor;
  
  animation-duration: $loaderDuration + ms;
  animation-timing-function: $animationTiming;
  animation-iteration-count: infinite;
  
  //loop through to add an animation delay
  @for $i from 1 through 6 {
    &:nth-child(#{$i}) {
      animation-delay: ($i * $loaderDelay) + ms;
    }
  }

  .loader--fade & {
    animation-name: fade;
    animation-duration: ($loaderDuration/2) + ms;
  }
}

@keyframes fade {
  0%    { opacity: 0;  }
  50%   { opacity: 1;  }
  100%  { opacity: 0;  }
}

</style>


