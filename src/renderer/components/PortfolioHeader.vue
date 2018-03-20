<template>
  <section id="portfolio-header">
    <simple-donut :percent="23"></simple-donut>
    <div class="ticker">
      <h1 class="underlined">My Porfolio</h1>
      <aph-balance amount="57,234.91"></aph-balance>
      <div class="change">
        <div class="label">24h change</div>
        <div class="amount">+$1,234.34</div>
      </div>
    </div>
    <div class="btn-group">
      <div class="receive-btn">
        <aph-icon name="receive"></aph-icon>
        <p>Receive</p>
      </div>
      <div class="send-btn">
        <aph-icon name="send"></aph-icon>
        <p>Send</p>
      </div>
    </div>
  </section>
</template>

<script>
import SimpleDonut from './charts/SimpleDonut';

export default {
  components: {
    SimpleDonut,
  },
};
</script>

<style lang="scss">
h1.underlined {
  @extend %underlined-header;
}

#portfolio-header {
  display: flex;
  flex-direction: row;
  padding: $space-lg;
  align-items: center;

  .simple-donut {
    margin: 0 $space-xl 0 0;
  }

  .btn-group {
    display: flex;
    flex-direction: row;
    flex: none;
  }

  .ticker {
    flex: 1;

    .change {
      align-items: center;
      display: flex;
      margin-top: $space;

      .label {
        @extend %small-uppercase-grey-label;
      }

      .amount {
        color: $green;
        font-size: $font-size-sm;
        margin-left: $space;
      }
    }
  }

  .receive-btn, .send-btn {
    @extend %btn-square;

    height: $space * 9;

    .aph-icon {
      .fill {
        fill: $dark;
      }
    }
  }

  .receive-btn {
    .aph-icon {
      .stroke {
        stroke: $dark !important;
      }
    }
  }

  .send-btn {
    background: $purple;
    margin-left: $space;

    p {
      color: white;
    }

    .aph-icon {
      .stroke {
        stroke: $dark !important;
      }
    }
  }
}
</style>


