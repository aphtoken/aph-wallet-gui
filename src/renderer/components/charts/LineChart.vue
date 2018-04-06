<script>
import { Line, mixins } from 'vue-chartjs';
const { reactiveProp } = mixins;

export default {
  extends: Line,
  mixins: [reactiveProp],
  props: ['options'],
  mounted() {
    this.renderChart(this.chartData, this.options);
  },

  methods: {
    render() {
      setTimeout(() => {
        this.renderChart(this.chartData, this.options);
      }, this.$constants.timeouts.RENDER_CHART);
    },
  },
};
</script>
