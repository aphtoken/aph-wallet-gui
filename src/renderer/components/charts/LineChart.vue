<script>
import { Line, mixins } from 'vue-chartjs';

const { reactiveProp } = mixins;
const DEFAULT_OPTIONS = {
  animation: false,
};

export default {
  beforeDestroy() {
    window.removeEventListener('resize', this.debouncedRender);
  },

  extends: Line,

  methods: {
    render() {
      setTimeout(() => {
        this.renderChart(this.chartData, _.merge(DEFAULT_OPTIONS, this.options));
      }, this.$constants.timeouts.RENDER_CHART);
    },
  },

  mixins: [reactiveProp],

  mounted() {
    this.render();

    this.debouncedRender = _.debounce(() => {
      this.render();
    }, this.$constants.charts.DEBOUNCE);

    window.addEventListener('resize', this.debouncedRender);
  },

  props: ['options'],
};
</script>

<style lang="scss" scoped>
canvas {
  width: 100% !important;
}
</style>

