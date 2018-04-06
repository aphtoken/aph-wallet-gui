<template>
  <div id="aph-add-edit-contact-modal">
    <div class="content">
      <div class="body">
        <aph-icon name="create"></aph-icon>
        <aph-input placeholder="Name" :light="true" v-model="name"></aph-input>
        <aph-input placeholder="Address" v-model="address"></aph-input>
        <div class="remove-btn" @click="remove" v-if="prevAddress">Remove</div>
      </div>
      <div class="footer">
        <div class="cancel-btn" @click="onCancel">Cancel</div>
        <div class="add-btn" @click="add" v-if="!prevAddress">Add</div>
        <div class="add-btn" @click="save" v-if="prevAddress">Save</div>
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
      name: '',
      address: '',
      prevAddress: null,
    };
  },

  mounted() {
    if (this.$store.state.currentEditContact) {
      this.name = this.$store.state.currentEditContact.name;
      this.address = this.$store.state.currentEditContact.address;
      this.prevAddress = this.$store.state.currentEditContact.address;
    }
  },

  methods: {
    add() {
      this.$services.contacts.add(this.address, {
        name: this.name.trim(),
        address: this.address.trim(),
      }).sync();

      this.$store.dispatch('fetchHoldings');
      this.onCancel();
    },

    remove() {
      this.$services.contacts.remove(this.prevAddress).sync();
      this.onCancel();
    },
  },
};
</script>


<style lang="scss">
#aph-add-edit-contact-modal {
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
  z-index: 9999;

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

        &::placeholder {
          color: $grey;
          font-family: GilroyMedium;
        }
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

  .remove-btn {
    display: flow;
    cursor: pointer;
    margin: $space-sm;
    padding-top: $space;
      &:hover {
        color: $purple;
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

