<template>
  <modal-wrapper id="aph-add-token-modal" identifier="addToken">
    <div class="body">
      <aph-form :on-submit="add">
        <aph-icon name="create"></aph-icon>
        <aph-select :options="currencies" :light="true" :onclick="this.currencyChanged()" :placeholder="$t('selectCurrency')" v-model="currency"></aph-select>
        <aph-input v-if="showNEO" placeholder="Script Hash or Token Symbol" :light="true" v-model="hashOrSymbol"></aph-input>
        <aph-input v-if="showETH" placeholder="Token Contract address" :light="true" v-model="contractAddress"></aph-input>
        <aph-input v-if="!currency" :light="true" v-model="contractAddress" :disabled="true"></aph-input>
      </aph-form>
    </div>
    <div class="footer">
      <button class="cancel-btn" @click="onCancel">Cancel</button>
      <button class="add-btn" @click="add" :disabled="shouldDisableAddButton">{{$t('add')}}</button>
    </div>
  </modal-wrapper>
</template>

<script>
import ModalWrapper from './ModalWrapper';

export default {
  components: {
    ModalWrapper,
  },

  computed: {
    currencies() {
      return [
        {
          label: 'NEO',
          value: 'NEO',
        },
        {
          label: 'ETH',
          value: 'ETH',
        },
      ];
    },

    shouldDisableAddButton() {
      let check = true;
      if (this.currency === 'NEO') {
        check = !this.hashOrSymbol.length;
      }

      if (this.currency === 'ETH') {
        check = !this.contractAddress.length;
      }

      return check || this.$isPending('addToken');
    },
  },

  data() {
    return {
      hashOrSymbol: '',
      currency: null,
      contractAddress: '',
      showETH: false,
      showNEO: false,
    };
  },

  methods: {
    add() {
      if (!this.currency) {
        return;
      }

      if (this.currency === 'NEO') {
        if (!this.hashOrSymbol) {
          return;
        }

        this.$store.dispatch('addToken', {
          currency: this.currency,
          hashOrSymbol: this.hashOrSymbol,
          done: () => {
            this.onCancel();
          },
        });
      }

      if (this.currency === 'ETH') {
        if (!this.contractAddress) {
          return;
        }

        this.$store.dispatch('addToken', {
          currency: this.currency,
          hashOrSymbol: this.contractAddress,
          done: () => {
            this.onCancel();
          },
        });
      }
    },

    currencyChanged() {
      if (this.currency) {
        if (this.currency === 'NEO') {
          this.contractAddress = '';
          this.showETH = false;
          this.showNEO = true;
        } else {
          this.hashOrSymbol = '';
          this.showNEO = false;
          this.showETH = true;
        }
      }
    },
  },

  props: {
    onCancel: {
      required: true,
      type: Function,
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

  .body {
    padding: $space-xl $space-lg $space-lg;
    text-align: center;

    .aph-icon {
      margin-bottom: $space-xl;

      svg {
        height: toRem(52px);
      }
    }

    .aph-select {
      margin-bottom: $space;
      svg {
        height: toRem(7px);
      }
    }

    .aph-input {
      border-color: $grey;

      &.focused {
        border-color: $purple;
      }

      input {
        color: $dark;
      }

      .placeholder {
        color: $grey;
        font-family: ProximaMedium;
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

    border-bottom-left-radius: $border-radius;
  }

  .add-btn {
    @extend %btn-footer;

    border-bottom-right-radius: $border-radius;
  }
}
</style>
