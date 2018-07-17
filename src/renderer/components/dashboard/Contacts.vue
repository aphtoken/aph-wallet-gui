<template>
  <section id="dashboard--contacts">
    <div class="header">
      <h1 class="underlined">{{$t('contacts')}}</h1>
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
  padding-bottom: $space-lg;

  .header {
    padding: $space-lg;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
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
        font-weight: GilroyMedium;
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
          font-family: GilroySemibold;
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

