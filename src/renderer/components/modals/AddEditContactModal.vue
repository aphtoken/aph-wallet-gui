<template>
  <modal-wrapper id="aph-add-edit-contact-modal">
    <div class="header" v-if="prevAddress">
      <div class="remove" @click="remove">{{$t('remove')}}</div>
    </div>
    <div class="body">
      <aph-form :on-submit="addOrSave">
        <aph-icon name="user"></aph-icon>
        <aph-input placeholder="Name" :light="true" v-model="name"></aph-input>
        <aph-input placeholder="Address" v-model="address"></aph-input>
      </aph-form>
    </div>
    <div class="footer">
      <button class="cancel-btn" @click="onCancel">{{$t('cancel')}}</button>
      <button class="add-btn" @click="save" v-if="prevAddress" :disabled="shouldDisableSaveAddButton">{{$t('save')}}</button>
      <button class="add-btn" @click="add" v-else :disabled="shouldDisableSaveAddButton">{{$t('add')}}</button>
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
    shouldDisableSaveAddButton() {
      return !this.address.length || !this.name.length;
    },
  },

  data() {
    return {
      address: '',
      name: '',
      prevAddress: null,
    };
  },

  methods: {
    add() {
      if (!this.address || !this.name) {
        return;
      }

      if (this.$services.contacts.contactExists(this.name.trim())) {
        this.$services.alerts.error(this.$t('contactExists', { name: this.name.trim() }));
        return;
      }

      this.$services.contacts.add(this.address, {
        name: this.name.trim(),
        address: this.address.trim(),
      }).sync();

      this.onCancel();
    },

    addOrSave() {
      if (this.prevAddress) {
        this.save();
      } else {
        this.add();
      }
    },

    save() {
      this.$services.contacts.remove(this.prevAddress)
        .add(this.address, {
          name: this.name.trim(),
          address: this.address.trim(),
        }).sync();

      this.onCancel();
    },

    remove() {
      this.$services.contacts.remove(this.prevAddress).sync();
      this.onCancel();
    },
  },

  mounted() {
    if (this.$store.state.currentEditContact) {
      this.name = this.$store.state.currentEditContact.name;
      this.address = this.$store.state.currentEditContact.address;
      this.prevAddress = this.$store.state.currentEditContact.address;
    }
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
#aph-add-edit-contact-modal {
  .header {
    padding: $space-lg $space-lg 0;

    .remove {
      @include transition(color);

      color: $grey;
      cursor: pointer;
      font-family: GilroyMedium;
      font-size: toRem(10px);
      text-align: right;
      text-transform: uppercase;

      &:hover {
        color: $purple;
      }
    }
  }

  .body {
    padding: $space-xl $space-lg $space-lg;
    text-align: center;

    .aph-icon {
      margin-bottom: $space-xl;

      svg {
        height: $space-xl;
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

    border-bottom-left-radius: $border-radius;
  }

  .add-btn {
    @extend %btn-footer;

    border-bottom-right-radius: $border-radius;
  }
}
</style>

