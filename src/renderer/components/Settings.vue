<template>
  <section id="settings">
    <div class="grid">
      <div class="grid--column left">
        <router-view name="left"></router-view>
      </div>
      <div class="grid--column right">
        <router-view name="top-right"></router-view>
        <router-view name="bottom-right"></router-view>
      </div>
    </div>
    <aph-add-contact-modal v-if="$store.state.showAddContactModal" :onCancel="hideAddContactModal"></aph-add-contact-modal>
  </section>
</template>
<script>
import AphAddContactModal from './settings/AddContactModal';
export default {
  components: {
    AphAddContactModal,
  },

  methods: {
    hideAddContactModal() {
      this.$store.commit('setShowAddContactModal', false);
    },
  },
};
</script>

<style lang="scss">
#settings {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: $space-lg;

  .grid {
    display: flex;
    flex-direction: row;
    flex: 1;
  }

  .grid--column {
    display: flex;
    flex-direction: column;
    flex: 1;

    &.left {
    }

    &.right {
      margin-left: $space-lg;
    }
  }
}
</style>

