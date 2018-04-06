<template>
  <section id="dashboard--contacts">
    <div class="header">
      <h1 class="underlined">Contacts</h1>
    </div>
    <div class="body">
      <section id="contact--table">
        <div class="body">
          <div v-for="(contact, index) in filteredContacts" :key="index"
             @click="useContact(contact)" class="contact">
            <div class="cell name">{{ contact.name }}</div>
            <div class="cell copy">
              <span class="copy-link" @click="copy(contact.address)">
                <aph-icon name="copy"></aph-icon>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script>
import { clipboard } from 'electron';
export default {

  computed: {
    filteredContacts() {
      const searchBy = this.searchBy.toLowerCase();
      const list = _.filter(this.$services.contacts.getAllAsArray(), ({ name, address }) => {
        if (!name || !address) {
          return false;
        }

        return name.toLowerCase().indexOf(searchBy) > -1
          || address.toLowerCase().indexOf(searchBy) > -1;
      });
      return list;
    },
  },

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
    copy(text) {
      clipboard.writeText(text);
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
        padding: 0;

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
  
      
          .copy {        
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
        
          &:hover, &.active {
            background: $light-grey;
          }     
      
        }  
      }
    }
  }
  
  

}
</style>

