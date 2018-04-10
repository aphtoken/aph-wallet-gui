<template>
  <div id="aph-add-token-modal">
    <div class="content">
      <div class="body">
        <aph-icon name="create"></aph-icon>
        <aph-input placeholder="Script Hash" :light="true" v-model="assetId"></aph-input>
        <aph-input placeholder="Token symbol" v-model="symbol"></aph-input>
      </div>
      <div class="footer">
        <div class="cancel-btn" @click="onCancel">Cancel</div>
        <div class="add-btn" @click="add">Add</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    onCancel: {
      required: true,
      type: Function,
    },
  },

  data() {
    return {
      assetId: '',
      symbol: '',
    };
  },

  methods: {
    add() {
      this.$store.dispatch('addToken', {
        assetId: this.assetId,
        isCustom: true,
        symbol: this.symbol,
        done: () => {
          this.onCancel();
        },
      });
    },
  },
};
</script>


<style lang="scss">
#aph-add-token-modal {
  align-items: center;
  background: rgba($dark, 0.8);
  bottom: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;

  .content {
    background: white;
    flex: none;
    width: toRem(400px);
  }

  .body {
    padding: $space-lg;
    text-align: center;

    .aph-icon {
      margin-bottom: $space-lg;

      svg {
        height: $space-xl;
      }
    }

    .aph-input {
      border-color: $dark;

      &.focused {
        border-color: $purple;
      }

      input {
        color: $dark;
      }

      .placeholder {
        color: $grey;
        font-family: GilroyMedium;
      }

      & + .aph-input {
        margin-top: $space;
      }
    }
  }

  .footer {
    display: flex;

    > * {
      flex: 1;
    }
  }

  .cancel-btn {
    @extend %btn-footer-light;
  }

  .add-btn {
    @extend %btn-footer;
  }
}
</style>

