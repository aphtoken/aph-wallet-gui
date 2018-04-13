<script>
import { Line, mixins } from 'vue-chartjs';
const { reactiveProp } = mixins;

export default {
  beforeDestroy() {
    window.removeEventListener('resize', this.render);
  },

  extends: Line,

  mounted() {
    this.render();

    window.addEventListener('resize', this.render);
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
