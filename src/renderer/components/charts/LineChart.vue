<script>
import { Line, mixins } from 'vue-chartjs';
const { reactiveProp } = mixins;

export default {
  beforeDestroy() {
    window.removeEventListener('resize', this.debouncedRender);
  },

  extends: Line,

  mounted() {
    this.render();

    this.debouncedRender = _.debounce(() => {
      this.render();
    }, this.$constants.charts.DEBOUNCE);

    window.addEventListener('resize', this.debouncedRender);
  },

  methods: {
    render() {
      setTimeout(() => {
        this.renderChart(this.chartData, this.options);
      }, this.$constants.timeouts.RENDER_CHART);
    },
  },

  mixins: [reactiveProp],

  props: ['options'],

};
</script>

<style lang="scss" scoped>
canvas {
  width: 100% !important;
}
</style>

