<template>
  <svg class="simple-donut" viewBox="0 0 140 140" preserveAspectRatio="xMinYMax meet">
    <circle class="base-circle" cx="70" cy="70" :r="radius" stroke-width="6" fill="none" />
    <circle :class="['value-circle', {increase: percent > 0, decrease: percent < 0}]" cx="70" cy="70" :r="radius" stroke-width="6" fill="none" :stroke-dasharray="strokeDashArray" />
    <g class="info">
      <text x="70" y="55" alignment-baseline="central" text-anchor="middle" class="label">{{ label }}</text>
      <text x="70" y="85" alignment-baseline="central" text-anchor="middle" :class="['percent', {increase: percent > 0, decrease: percent < 0}]">{{ formattedPercent }}%</text>
    </g>
  </svg>
</template>

<script>
export default {
  computed: {
    circumference() {
      return Math.round(2 * this.radius * Math.PI);
    },

    formattedPercent() {
      return this.percent > 0
        ? `+${this.$formatNumber(this.percent, '0,0[.]0', 0)}` : this.$formatNumber(this.percent, '0,0[.]0', 0);
    },

    strokeDashArray() {
      return `${this.strokeLength},${this.circumference}`;
    },

    strokeLength() {
      return Math.round(this.circumference * (Math.abs(this.percent) / 100));
    },
  },

  data() {
    return {
      radius: 65,
    };
  },

  props: {
    label: {
      default: '24 Hour',
      type: String,
    },
    percent: {
      default: 0,
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
    transform-origin: center;

    &.decrease {
      stroke: $red;
      transform: rotate(-90deg) scale(1,-1);
    }

    &.increase {
      stroke: $green;
      transform: rotate(-90deg);
    }
  }

  .label {
    fill: $darker-grey;
    font-family: GilroyMedium;
    font-size: toRem(12px);
    text-transform: uppercase;
  }

  .percent {
    font-size: toRem(22px);

    &.decrease {
      fill: $red;
    }

    &.increase {
      fill: $green;
    }
  }
}
</style>


