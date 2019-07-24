<template>
  <section id="dashboard--contacts">
    <div class="header">
      <h2 class="underlined">{{$t('contacts')}}</h2>
    </div>
    <div class="body">
      <div v-if="!$store.state.contacts.length" class="zero-state">
        <aph-icon name="no-contacts"></aph-icon>
        <div class="label">{{$t('noContacts')}}</div>
      </div>
      <div v-else class="table">
        <div v-for="(contact, index) in $store.state.contacts" :key="index" @click="useContact(contact)" class="contact">
          <div class="cell name">{{ contact.name }}</div>
          <div class="cell copy">
            <aph-copy-text :text="contact.address"></aph-copy-text>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      searchBy: '',
    };
  },

  methods: {
    useContact(contact) {
      // todo, send this over to the address field on the send form automatically?
      console.log(contact);
    },
  },
};
</script>

<style lang="scss">
#dashboard--contacts {
  @extend %tile-light;

  display: flex;
  flex-direction: column;
  margin: $space;
  padding-bottom: $space-lg;

  .header {
    flex: none;
    padding: $space $space-lg;
    font-size: toRem(10px);
  }

  .body {
    padding: 0 $space-lg;
    overflow: auto;
    height: 100%;

    > .zero-state {
      align-items: center;
      display: flex;
      height: 100%;
      justify-content: center;
      flex-direction: column;

      .aph-icon {
        svg {
          height: toRem(52px);

          .fill {
            fill: $purple;
          }
        }
      }

      .label {
        color: $purple;
        font-weight: ProximaMedium;
        margin-top: $space-lg;
      }
    }

    .table {
      display: flex;
      flex-direction: column;

      .contact {
        @include transition(background-color);

        align-items: center;
        background-color: transparent;
        border-top: toRem(1px) solid $background;
        display: flex;
        flex-wrap: wrap;
        font-size: toRem(12px);

        .cell {
          flex: 1;
          font-family: ProximaSemibold;
          padding: $space;

          &.copy {
            flex: none;
          }
        }

        &:hover, &.active {
          background-color: $background;
        }
      }
    }
  }



}
</style>
