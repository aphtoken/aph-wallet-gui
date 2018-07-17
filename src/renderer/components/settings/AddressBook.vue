<template>
  <section id="settings--address-book">
    <div class="contacts-table">
      <div class="header">
        <h1 class="underlined">{{$t('addressBook')}}</h1>
      </div>
      <div class="search-field">
        <aph-icon name="search"></aph-icon>
        <input :placeholder="$t('search')" v-model="searchBy">
      </div>
      <div class="contacts">
        <div class="body">
          <div v-for="(contact, index) in filteredContacts" :key="index" :class="['contact', {active: contact.active}]">
            <div class="summary">
              <div class="cell name" @click="toggleContact(contact)">{{ contact.name }}</div>
              <div class="cell copy">
                <aph-copy-text :text="contact.address"></aph-copy-text>
              </div>
            </div>
            <div class="details">
              <div class="section">
                <div class="row">
                  <div class="column">
                    <div class="label">{{$t('address')}}</div>
                    <div class="value">{{ contact.address }}</div>
                  </div>
                  <div class="column right">
                    <div class="edit" @click="showEditContactModal(contact)">
                      <aph-icon name="back"></aph-icon>{{$t('edit')}}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="add-contact">
      <div class="cta">{{$t('addContact')}}</div>
      <div class="btn-circle" @click="showAddContactModal">
        <aph-icon name="plus"></aph-icon>
      </div>
    </div>
    <aph-add-edit-contact-modal v-if="$store.state.showAddContactModal" :onCancel="hideAddContactModal"></aph-add-edit-contact-modal>
  </section>
</template>

<script>
import AphAddEditContactModal from '../modals/AddEditContactModal';

export default {
  components: {
    AphAddEditContactModal,
  },

  computed: {
    filteredContacts() {
      const searchBy = this.searchBy.toLowerCase();
      const list = _.filter(this.$store.state.contacts, ({ name, address }) => {
        if (!name || !address) {
          return false;
        }

        return name.toLowerCase().indexOf(searchBy) > -1
          || address.toLowerCase().indexOf(searchBy) > -1;
      }).map((contact) => {
        const active = this.activeContact ? contact.address === this.activeContact.address : false;

        return _.merge(contact, {
          active,
          address: contact.address,
        });
      });
      return list;
    },
  },

  data() {
    return {
      activeContact: null,
      searchBy: '',
    };
  },

  methods: {
    hideAddContactModal() {
      this.$store.commit('setShowAddContactModal', false);

      // this is a hack but not sure how to inform vue to read filteredContacts again
      const search = this.searchBy;
      this.searchBy = null;
      this.searchBy = search;
    },

    toggleContact(contact) {
      if (contact === this.activeContact) {
        contact.active = false;
        this.activeContact.active = false;
        this.activeContact = null;
        this.$store.commit('setActiveTransaction', null);
      } else {
        contact.active = true;
        this.activeContact = contact;
      }
    },

    showAddContactModal() {
      this.$store.commit('setShowAddContactModal', true);
    },

    showEditContactModal(contact) {
      this.$store.commit('setShowEditContactModal', contact);
    },
  },
};
</script>

<style lang="scss">
#settings--address-book {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .contacts-table {
    @extend %tile-light;

    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;

    .header {
      flex: none;
      padding: $space-lg;

      h1.underlined {
        @extend %underlined-header;

        flex: 1;
        margin-bottom: 0;
      }
    }

    .search-field {
      border-bottom: $border-thin;
      display: flex;
      flex: none;
      margin: 0 $space-lg $space-lg;
      padding: $space-sm 0;

      .aph-icon {
        flex: none;
        margin: 0 $space;

        svg {
          height: toRem(22px);

          .fill {
            fill: $purple;
          }
        }
      }

      input {
        background: none;
        border: none;
        color: $dark;
        font-family: GilroyMedium;
        font-size: toRem(15px);
        outline: none;
        padding: 0;
        width: 100%;

        &::placeholder {
          color: $grey;
        }
      }
    }


    .contacts {
      flex: 1;
      margin: 0 $space-lg;
      height: 95%;
      overflow-y: auto;

      .body {
        height: 90%;
        overflow-y: auto;

        .contact {
          @include transition(background-color);

          background-color: transparent;
          border-top: toRem(1px) solid $background;

          .summary {
            align-items: center;
            cursor: pointer;
            display: flex;
            flex-wrap: wrap;
          }

          .cell {
            flex: 1;
            font-family: GilroySemibold;
            padding: $space;
          }

          &:hover, &.active {
            background-color: $background;
          }

          .name {
            flex: 4;
          }

          .copy {
            flex: none;
          }

          .edit {
            cursor: pointer;
            display: inline-block;
            position: relative;
            color: $grey;
            font-weight: bold;

            .aph-icon {
              margin-left: $space-sm;
              display: inline-block;

              svg {
                height: toRem(12px);

                .fill {
                  fill: $grey;
                }
              }
            }

            &:hover {
              color: $purple;

              .fill {
                fill: $purple;
              }
            }
          }

          .details {
            display: none;
            flex-wrap: wrap;
            padding: $space;

            .section {
              display: flex;
              flex-wrap: wrap;
              width: 100%;
            }

            .section + .section {
              margin-top: $space-lg;
            }

            .row {
              display: flex;
              width: 100%;

              .column {
                flex: 1;

                .label {
                  @extend %small-uppercase-grey-label;

                  margin-bottom: $space-sm;
                }

                .value {
                  font-family: GilroySemibold;
                  font-size: toRem(12px);
                }

                & + .column {
                  margin-left: $space-xl;
                }

                &.right {
                  align-items: center;
                  display: flex;
                  flex: none;
                  font-size: toRem(12px);
                  justify-content: right;
                  font-family: GilroySemibold;

                  .edit {
                    @include transition(color);

                    display: flex;

                    .aph-icon {
                      margin-right: $space-sm;

                      svg {
                        height: toRem(12px);
                      }
                    }

                    &:hover {
                      color: $purple;

                      .aph-icon {
                        .fill {
                          fill: $purple;
                        }
                      }
                    }
                  }
                }
              }

              &.has-equal-columns {
                .column {
                  flex: 1;
                }
              }

              & + .row {
                margin-top: $space;
              }
            }
          }

          &.active {
            .details {
              display: flex;
              width: 100%;
            }
          }
        }
      }
    }
  }

  .add-contact {
    flex: none;

    .cta {
      @extend %tile-light;

      border-top-left-radius: 0;
      border-top-right-radius: 0;
      color: $purple;
      font-family: GilroyMedium;
      font-size: toRem(16px);
      padding: $space-lg 0 $space-xl;
      text-align: center;
    }

    .btn-circle {
      @extend %btn-circle;

      margin-left: 50%;
      transform: translate(-50%, -50%);
    }

    &:hover {
      .btn-circle {
        box-shadow: $box-shadow-sm;
      }
    }
  }
}
</style>
