<template>
  <section id="settings--address-book">
    <div class="header">
      <h1 class="underlined">Address Book</h1>
    </div>
    <div class="search-field">
      <aph-icon name="search"></aph-icon>
      <input placeholder="Search" v-model="searchBy">
    </div>

    <div class="contacts">
      <div class="body">
        <div v-for="(contact, index) in filteredContacts" :key="index" :class="['contact', {active: contact.active}]">
          <div class="summary">
            <div class="cell name" @click="toggleContact(contact)">{{ contact.name }}</div>
            <div class="cell copy">
              <span class="copy-link" @click="copy(contact.address)">
                <aph-icon name="copy"></aph-icon>
              </span>
            </div>
          </div>
          <div class="details">
            <div class="section">
              <div class="row">
                <div class="column">
                  <div class="label">Address</div>
                  <div class="value">{{ contact.address }}</div>
                </div>
                <div class="column right">
                  <div class="edit" @click="showEditContactModal(contact)">
                    <aph-icon name="back"></aph-icon>Edit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="add-contact">
      <div class="cta">Add contact</div>
      <div class="btn-circle" @click="showAddContactModal">
        <aph-icon name="show"></aph-icon>
      </div>
    </div>
    <aph-add-edit-contact-modal v-if="$store.state.showAddContactModal" :onCancel="hideAddContactModal"></aph-add-edit-contact-modal>
  </section>
</template>

<script>
import { clipboard } from 'electron';
import AphAddEditContactModal from './AddEditContactModal';

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
    copy(text) {
      clipboard.writeText(text);
    },

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
  @extend %tile-light;

  .header {
    padding: $space-lg;

    h1.underlined {
      @extend %underlined-header;

      flex: 1;
      margin-bottom: 0;
    }
  }

  .search-field {
    border-bottom: $border;
    border-color: $grey;
    display: flex;
    flex: none;
    margin: 0 $space-lg $space-lg;
    padding: $space 0;

    .aph-icon {
      flex: none;
      margin: 0 $space;

      svg {
        height: toRem(40px);

        .fill {
          fill: $purple;
        }
      }
    }

    input {
      background: none;
      border: none;
      color: $dark;
      font-family: GilroySemibold;
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
    padding: 0 $space-lg;
    height: 95%;

    .header {
      display: flex;
      padding: 0;

      .cell {
        @extend %small-uppercase-grey-label;

        flex: 1;
        padding: $space;
      }
    }

    .body {
      height: 90%;
      overflow-y: auto;

      .contact {
        background: transparent;
        border-top: 1px solid $light-grey;
        transition: $transition;
      
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
          min-height: 44px;    
        }
        
        &.active {
          .summary:hover .cell {
            background: #cccccc;
          }
        }
        
        &:hover, &.active {
          background: $light-grey;
        }

        .name {
          flex: 4;
        }

        .copy {
          flex: 1;
        }

        .copy, .edit {
          display: inline-block;
          position: relative;
          color: $grey;
          font-weight: bold;

          .copy-link {
            position: absolute;
            right: 0;
            top: $space * .8;
          }

          .aph-icon {
            cursor: pointer;
            margin-left: $space-sm;
            display: inline-block;   
            min-height: 44px;

            path {
              fill: $grey;
              transition: $transition;
            }

            svg {
              height: $space;
            }
          }

          &:hover {
            color: $purple;

            path {
              fill: $purple;
            }
          }
        }

        .copy {
          padding-right: $space;
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
                  display: flex;
                  transition: $transition;

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


          .inputs, .outputs {
            max-width: 35rem;
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


  .add-contact {
    margin-top: $space-xl;

    .cta {
      color: $purple;
      font-family: GilroyMedium;
      font-size: toRem(16px);
      text-align: center;
    }

    .btn-circle {
      @extend %btn-circle;

      margin-left: 50%;
      transform: translate(-50%, 50%);
    }
  }
}
</style>
