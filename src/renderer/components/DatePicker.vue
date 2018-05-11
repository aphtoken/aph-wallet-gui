<template>
  <div class="aph-date-picker">
    <div class="label" @click="toggleOpen">
      <div class="value">{{ label }}</div>
      <aph-icon name="calendar"></aph-icon>
    </div>
    <div class="calendar-wrapper" v-if="isOpen">
      <div class="controls">
        <div class="left" @click="goToPreviousMonth">
          <aph-icon name="arrow-left"></aph-icon>
        </div>
        <div class="center">{{ month }}</div>
        <div class="right" @click="goToNextMonth">
          <aph-icon name="arrow-right"></aph-icon>
        </div>
      </div>
      <div class="weekdays">
        <div class="div">SU</div>
        <div class="div">MO</div>
        <div class="div">TU</div>
        <div class="div">WE</div>
        <div class="div">TH</div>
        <div class="div">FR</div>
        <div class="div">SA</div>
      </div>
      <div class="calendar-days">
        <div class="week" v-for="(week, weekIndex) in weeks" :key="weekIndex">
          <div @click="toggleSelectedDay(day.moment)" :class="['day', {active: day.isSelectedDay, 'disabled': day.disabled, 'is-today': isToday(day.moment)}]" v-for="(day, dayIndex) in week" :key="dayIndex">{{ day.label }}</div>
        </div>
      </div>
    </div>
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
    label() {
      return this.selectedDay ? this.selectedDay.format('YYYY-MM-DD') : this.placeholder;
    },

    month() {
      return this.currentMonth.format('MMMM');
    },

    weeks() {
      const nextMonth = moment(this.currentMonth).add(1, 'month');
      const previousMonth = moment(this.currentMonth).subtract(1, 'month');
      const daysCurrentMonth = this.getDaysInMonth(this.currentMonth.format('Y'), this.currentMonth.format('M'));
      const daysNextMonth = this.getDaysInMonth(nextMonth.format('Y'), nextMonth.format('M'));
      const daysPreviousMonth = this.getDaysInMonth(previousMonth.format('Y'), previousMonth.format('M'));
      const endingDayOfWeek = _.last(daysCurrentMonth).format('d');
      const startingDayOfWeek = _.first(daysCurrentMonth).format('d');
      const daysToAppend = _.map(
        _.slice(daysNextMonth, 0, 6 - endingDayOfWeek), (day) => {
          return _.set(day, 'notInMonth', true);
        },
      );
      const daysToPrepend = _.map(
        _.slice(daysPreviousMonth, daysPreviousMonth.length - startingDayOfWeek), (day) => {
          return _.set(day, 'notInMonth', true);
        },
      );
      const days = daysToPrepend.concat(daysCurrentMonth).concat(daysToAppend);

      return _.chain(days)
        .map((day) => {
          return {
            isSelectedDay: day.isSame(this.selectedDay, 'day'),
            label: day.format('D'),
            moment: day,
            disabled: day.notInMonth,
          };
        })
        .chunk(7)
        .value();
    },
  },

  data() {
    return {
      currentMonth: moment().startOf('month'),
      isOpen: false,
      selectedDay: null,
    };
  },

  methods: {
    close() {
      this.isOpen = false;
    },
    setDay(day) {
      this.selectedDay = day;
    },

    getDaysInMonth(year, month) {
      const days = [];
      const date = moment(`${year}-${month}`, 'YYYY-M');
      let daysInMonth = date.daysInMonth();

      while (daysInMonth) {
        days.push(moment(date).date(daysInMonth));
        daysInMonth -= 1;
      }

      return days.reverse();
    },

    goToNextMonth() {
      this.currentMonth = moment(this.currentMonth).add(1, 'month');
    },

    goToPreviousMonth() {
      this.currentMonth = moment(this.currentMonth).subtract(1, 'month');
    },

    isToday(date) {
      return moment().isSame(date, 'day');
    },

    notInCurrentMonth(date) {
      return this.currentMonth.format('M') !== date.format('M');
    },

    toggleOpen() {
      this.isOpen = !this.isOpen;

      if (this.isOpen) {
        this.currentMonth = this.selectedDay ? moment(this.selectedDay).startOf('month') : moment(this.currentMonth);
      }
    },

    toggleSelectedDay(day) {
      if (day.isSame(this.selectedDay, 'day')) {
        this.selectedDay = null;
      } else {
        this.selectedDay = moment(day);
        this.close();
      }

      this.$emit('input', day);
    },
  },

  props: {
    placeholder: {
      default: 'Date',
      type: String,
    },
  },
};
</script>

<style lang="scss">
.aph-date-picker {
  position: relative;

  * {
    user-select: none;
  }

  .label {
    align-items: center;
    background: $background;
    border-radius: $border-radius;
    cursor: pointer;
    display: flex;
    font-family: GilroyMedium;
    height: $input-height;
    padding: 0 $space;

    .value {
      flex: 1;
    }

    .aph-icon {
      align-items: center;
      display: flex;
      flex: none;

      svg {
        height: toRem(18px);

        .fill {
          fill: $purple;
        }
      }
    }
  }

  .calendar-wrapper {
    align-items: center;
    background: white;
    border-radius: $border-radius;
    box-shadow: $box-shadow;
    left: 0;
    margin: $space 0 0;
    padding: 0;
    position: absolute;
    top: 100%;
    width: 100%;
    z-index: 100;

    .controls {
      display: flex;

      .left, .right {
        cursor: pointer;
        flex: none;
        padding: $space-lg $space;

        svg {
          height: toRem(14px);

          .fill {
            fill: $purple;
          }
        }
      }

      .center {
        align-items: center;
        color: $purple;
        display: flex;
        flex: 1;
        font-family: GilroyMedium;
        font-size: toRem(14px);
        justify-content: center;
      }
    }

    .weekdays {
      background: $background;
      display: flex;
      padding: $space $space-sm;

      > div {
        @extend %small-uppercase-grey-label-dark;

        flex: 1;
        padding: $space-sm;
        text-align: center;
      }
    }

    .calendar-days {
      padding: $space-sm;

      .week {
        display: flex;

        .day {
          @include transition(background-color, color);

          align-items: center;
          background-color: transparent;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          flex: 1;
          font-family: GilroyMedium;
          font-size: toRem(13px);
          justify-content: center;
          margin: $space-xs;
          text-align: center;

          &:before{
            content: "";
            display: block;
            padding-top: 100%;
          }

          &.disabled {
            color: $grey;
          }

          &.is-today {
            background-color: $background;
          }

          &:hover, &.active {
            background-color: $purple;
            color: white;
          }
        }
      }
    }
  }
}
</style>


