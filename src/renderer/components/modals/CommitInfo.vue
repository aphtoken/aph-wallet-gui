<template>
  <modal-wrapper id="commit-info-modal">
    <div class="body">
      <div class="icons">
        <aph-icon name="hex"></aph-icon>
        <aph-icon name="commit"></aph-icon>
      </div>
      <h1>{{$t('commitInfoHeader')}}</h1>
      <p>{{$t('commitInfoBody1')}}</p>
      <p>{{$t('commitInfoBody2')}}</p>
    </div>
    <div class="footer">
      <div class="accept-btn" @click="accept">{{$t('close')}}</div>
    </div>
  </modal-wrapper>
</template>

<script>
import ModalWrapper from './ModalWrapper';
export default {
  components: {
    ModalWrapper,
  },

  methods: {
    accept() {
      this.$store.commit('setAcceptCommitInfo', true);
    },
  },
};
</script>


<style lang="scss">
#commit-info-modal {
  .content {
    width: toRem(700px);
    overflow: visible;
  }
  
  .body {
    display: block;
    padding: $space-xl;
    text-align: center;

    h1 {
      font-size: toRem(20px);
      margin: 0 0  $space-lg;
      color: $purple;
    }

    p {
      line-height: $copy-line-height;
      margin: 0;
    }
    
      
        
    .icons {
      position: relative;
      margin: toRem(-80px) auto toRem(80px) auto;
      width: toRem(40px);
      height: toRem(40px);     
          
      .aph-icon {
        position: absolute;
        width: toRem(40px);
        height: toRem(40px);

        .icon {
          svg {
            position: relative;
            margin-top: 10%;
          }
            
          &.commit {
            margin: toRem(5px) 0 0 0;
            .fill {
              fill: white;
            }
          }
            
          &.hex {
            margin: toRem(-25px);
            .fill {
              fill: $purple;
            }
          }
        }
      }
    }  
  }

  .footer {
    display: flex;
    width: auto;

    > * {
      flex: 1;
    }
  }

  .accept-btn {
    @extend %btn-footer;
  }
}
</style>

