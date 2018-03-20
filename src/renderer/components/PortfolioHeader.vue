<template>
  <section id="portfolio-header">
    <div class="ticker"></div>
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
export default {

};
</script>

<style lang="scss">
#portfolio-header {
  display: flex;
  flex-direction: row;
  padding: $space-lg;

  .btn-group {
    display: flex;
    flex-direction: row;
    flex: none;
  }

  .ticker {
    flex: 1;
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


