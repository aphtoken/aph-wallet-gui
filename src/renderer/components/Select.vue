<template>
  <div :class="['aph-select', {'is-open': isOpen}]">
    <div class="aph-select--label" @click="toggleOpen">{{ label }}</div>
    <ul class="aph-select--dropdown" v-if="isOpen">
      <li :class="{selected: isSelected(option)}" v-for="(option, index) in options" :key="index" @click="toggleSelectedOption(option)">{{ option.label }}</li>
    </ul>
    <aph-icon :name="iconName"></aph-icon>
  </div>
</template>

<script>
export default {
  beforeDestroy() {
    document.removeEventListener('click', this.close);
  },

  beforeMount() {
    document.addEventListener('click', (e) => {
      if (!this.$el || !this.$el.contains(e.target)) {
        this.close();
      }
    });
  },

  computed: {
    iconName() {
      return this.isOpen ? 'arrow-up' : 'arrow-down';
    },

    label() {
      return this.selectedOption ? this.selectedOption.label : this.placeholder;
    },
  },

  data() {
    return {
      isOpen: false,
      selectedOption: null,
    };
  },

  methods: {
    close() {
      this.isOpen = false;
    },

    isSelected(option) {
      return this.selectedOption === option;
    },

    toggleOpen() {
      this.isOpen = !this.isOpen;
    },

    toggleSelectedOption(option) {
      this.selectedOption = this.isSelected(option) ? null : option;
      this.$emit('input', this.selectedOption);
      this.close();
    },
  },

  props: {
    options: {
      default() {
        return [];
      },
      type: Array,
    },

    placeholder: {
      default() {
        return 'No Option Select';
      },
      type: String,
    },
  },
};
</script>

<style lang="scss">
.aph-select {
  display: block;
  position: relative;
  width: 100%;

  * {
    user-select: none;
  }

  .aph-icon {
    position: absolute;
    right: $space-sm;
    top: 50%;
    transform: translate(-50%, -50%);

    svg {
      height: $space-sm;
    }

    path {
      fill: white;
    }
  }

  &.is-open {
    .aph-select--label {
      background: $purple;
    }

    .aph-icon {
      svg {
        transform: translate(-20.5 -22.5);
      }
    }
  }
}

.aph-select--label {
  border-radius: $border-radius;
  border: $border;
  color: white;
  cursor: pointer;
  font-size: toRem(16px);
  padding: $space * 0.7 $space * 5;
  text-align: center;
  transition: all .1s linear;
  white-space: nowrap;
}

.aph-select--dropdown {
  background: white;
  border-radius: $border-radius;
  left: 0;
  list-style-type: none;
  margin: $space-lg 0 0;
  padding: 0;
  position: absolute;
  top: 100%;
  width: 100%;
  z-index: 100;

  > li {
    cursor: pointer;
    font-size: toRem(16px);
    padding: $space;
    transition: all .1s linear;

    &:hover,
    &.selected {
      background: #f4f4fc;
      color: $purple;
    }

    &:first-child {
      border-top-left-radius: $border-radius;
      border-top-right-radius: $border-radius;
    }

    &:last-child {
      border-bottom-left-radius: $border-radius;
      border-bottom-right-radius: $border-radius;
    }
  }
}
</style>
