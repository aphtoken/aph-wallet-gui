<template>
  <section id="dashboard--sidebar">
    <div class="header">
      <aph-icon name="logo"></aph-icon>
    </div>
    <div class="menu link-list">
      <a>
        <span class="icon">
          <aph-icon name="wallet"></aph-icon>
        </span>
        <span class="label">Dashboard</span>
      </a>
      <a>
        <span class="icon">
          <aph-icon name="wallet"></aph-icon>
        </span>
        <span class="label">Assets</span>
      </a>
      <a>
        <span class="icon">
          <aph-icon name="wallet"></aph-icon>
        </span>
        <span class="label">History</span>
      </a>
      <a>
        <span class="icon">
          <aph-icon name="wallet"></aph-icon>
        </span>
        <span class="label">Settings</span>
      </a>
    </div>
    <div class="footer link-list">
      <a @click="logOut">
        <span class="icon">
          <aph-icon name="back"></aph-icon>
        </span>
        <span class="label">Log Out</span>
      </a>
    </div>
  </section>
</template>

<script>
export default {
  methods: {
    logOut() {
      this.$router.push('login');
    },
  },
};
</script>

<style lang="scss">
#dashboard--sidebar {
  background: $purple;
  display: flex;
  flex-direction: column;

  .header {
    flex: none;
    padding: $space-xl $space-xl $space-lg;

    .logo--mark {
      fill: white;
    }
    .logo--word {
      display: none;
    }
  }

  .link-list {
    margin: 0;
    padding: 0;

    a {
      align-items: center;
      border-left: 3px solid transparent;
      color: white;
      cursor: pointer;
      display: flex;
      font-size: $font-size-lg;
      padding: $space-sm 0;
      transition: $transition;

      .icon {
        flex: 1;
        text-align: center;

        svg {
          height: $space * 2;
        }

        path {
          transition: $transition;
        }
      }

      .label {
        flex: 1.75;
      }

      &:hover {
        border-color: white;

        .icon path {
          fill: white;
        }
      }

      & + a {
        margin-top: $space;
      }
    }
  }
  .menu {
    flex: 1;
  }

  .footer {
    flex: none;
    padding-bottom: $space;

    a {
      font-size: $font-size-sm;

      &:hover {
        border-color: transparent;
      }

      .icon {
        svg {
          height: $space;
        }

        path {
          fill: white;
        }
      }
    }
  }
}
</style>


