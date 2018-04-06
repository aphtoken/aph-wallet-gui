<template>
  <section id="settings--address-book">
    <div class="header">
      <h1 class="underlined">Address Book</h1>
    </div>
    <div class="search">
      <input placeholder="Search" v-model="searchBy" />
    </div>

    <section id="contact--table">
      <div class="body">
        <div v-for="(contact, index) in filteredContacts" :key="index"
           @click="openContact(contact)"
           :class="['contact', {active: contact.active}]">
          <div class="cell name">{{ contact.name }}</div>
          <div class="cell copy">
            <span class="copy-link" @click="copy(contact.address)">
              <aph-icon name="copy"></aph-icon>
            </span>
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
                    <aph-icon name="arrow-left"></aph-icon>
                     Edit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <div class="add-contact">
      <div class="btn-square">
        <p>Add address</p>
      </div>
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
      const list = _.filter(this.$services.contacts.getAllAsArray(), ({ name, address }) => {
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
      searchBy: '',
      activeContact: null,
    };
  },

  methods: {
    showAddContactModal() {
      this.$store.commit('setShowAddContactModal', true);
    },
    showEditContactModal(contact) {
      this.$store.commit('setShowEditContactModal', contact);
    },
    hideAddContactModal() {
      this.$store.commit('setShowAddContactModal', false);

      // this is a hack but not sure how to inform vue to read filteredContacts again
      const search = this.searchBy;
      this.searchBy = null;
      this.searchBy = search;
    },
    copy(text) {
      clipboard.writeText(text);
    },
    openContact(contact) {
      if (this.activeContact) {
        this.activeContact.active = false;
      }

      contact.active = true;
      this.activeContact = contact;
    },
    closeContact() {
      this.activeContact.active = false;
      this.activeContact = null;
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

  .search {
    border-bottom: $border;
    border-color: $grey;
    display: flex;
    flex: none;
    margin: 0 $space $space-lg $space-lg;
    padding: $space 0;

    .aph-icon {
      flex: none;
      margin: 0 $space;

      svg {
        height: $space-lg;
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


  #contact--table {
    padding: $space-lg $space-lg 0;
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
        align-items: center;
        background: transparent;
        border-top: 1px solid $light-grey;
        cursor: pointer;
        display: flex;
        transition: $transition;
        flex-wrap: wrap;

        .cell {
          flex: 1;
          font-family: GilroySemibold;
          padding: $space;
        }

        &:hover, &.active {
          background: $light-grey;
        }     
      
        .copy, .edit {        
          display: inline-block;
          position: relative;
          margin: 0 $space 0 0;
          color: $grey;
          font-weight: bold;
      
          .copy-link {
            position: absolute;
            right: 0;
            top: $space * .4;
          }

          .aph-icon {
            cursor: pointer;
            margin-left: $space-sm;
            display: inline-block;

            path {
              fill: $grey;
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
            

        .details {
          display: none;
          padding: $space;
          flex-wrap: wrap;

          .section {
            display: flex;
            width: 100%;
            flex-wrap: wrap;
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
                width: 20%;
                text-align: right;
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
    position: relative;

    .btn-square {
      @extend %btn-square;
      cursor: default;
      height: auto;
      padding: 1.75rem 0;
      width: 100%;

      .aph-icon {
        .fill {
          fill: $dark;
        }
      }

      &:hover {
        background: white;
        color: $dark;

        .aph-icon {
          .fill {
            fill: $purple;
          }
        }
      }
    }

    .btn-circle {
      @extend %btn-circle;

      left: 50%;
      position: absolute;
      top: 100%;
      transform: translate(-50%, -50%);
    }
  }
}
</style>
