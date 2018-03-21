<template>
  <svg class="simple-donut" viewBox="0 0 150 150">
    <circle class="base-circle" cx="75" cy="75" :r="radius" stroke-width="5" fill="none" />
    <circle class="value-circle" cx="75" cy="75" :r="radius" stroke-width="5" fill="none" :stroke-dasharray="strokeDashArray" />
    <g class="info">
      <text x="75" y="55" alignment-baseline="central" text-anchor="middle" class="label">{{ label }}</text>
      <text x="75" y="85" alignment-baseline="central" text-anchor="middle" class="percent">+{{ percent }}%</text>
    </g>
  </svg>
</template>

<script>
const PI = 3.14;

export default {
  computed: {
    circumference() {
      return Math.round(2 * this.radius * PI);
    },

    strokeDashArray() {
      return `${this.strokeLength},${this.circumference}`;
    },

    strokeLength() {
      return Math.round(this.circumference * (this.percent / 100));
    },
  },

  data() {
    return {
      radius: 60,
    };
  },

  props: {
    label: {
      default: '24 Hour',
      type: String,
    },
    percent: {
      required: true,
      type: Number,
    },
  },
};
</script>

<style lang="scss">
.simple-donut {
  height: $space * 10;

  .base-circle {
    stroke: white;
  }

  .value-circle {
    stroke: $green;
    transform-origin: center;
    transform: rotate(-90deg);
  }

  .label {
    fill: $grey;
    font-family: GilroyMedium;
    font-size: toRem(12px);
    text-transform: uppercase;
  }

  .percent {
    fill: $green;
    font-size: toRem(30px);
    font-family: GilroyMedium;
  }
}
</style>


