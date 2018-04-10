<template>
  <div id="aph-add-token-modal">
    <div class="content">
      <div class="body">
        <aph-icon name="create"></aph-icon>
        <aph-input placeholder="Script Hash or Token Symbol" :light="true" v-model="userEntry"></aph-input>
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
      userEntry: '',
    };
  },

  methods: {
    add() {
      if (!this.userEntry || this.userEntry.length < 2) {
        this.$services.alerts.error('Please enter a token script hash or symbol');
        return;
      }

      this.userEntry = this.userEntry.replace('0x', '');

      const allTokens = this.$services.tokens.getAllAsArray();
      let token = _.find(allTokens, (o) => {
        return o.symbol === this.userEntry && o.network === this.$store.state.currentNetwork.net;
      });

      if (!token) {
        token = _.find(allTokens, (o) => {
          return o.assetId === this.userEntry && o.network === this.$store.state.currentNetwork.net;
        });
      }

      if (!token) {
        this.$services.alerts.error(`Unable to find a token with the symbol or script hash of '${this.userEntry}' on ${this.$store.state.currentNetwork.net}`);
        return;
      }

      this.$store.dispatch('addToken', {
        assetId: token.assetId,
        isCustom: true,
        symbol: token.symbol,
        done: () => {
          this.$services.alerts.success(`Successfully added ${token.symbol}`);
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

