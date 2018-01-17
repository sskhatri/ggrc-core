/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

let baseCmpName = 'tasks-counter';

/**
 *  Component to show number of Tasks Owned by Person
 *
 */
export default GGRC.Components('tasksCounter', {
  tag: baseCmpName,
  template: `<div class="tasks-counter {{stateCss}}">{{tasksAmount}}</div>`,
  viewModel: {
    define: {
      tasksAmount: {
        type: 'number',
        value: 0,
        set: function (newValue) {
          return newValue < 0 ? 0 : newValue;
        }
      },
      hasOverdue: {
        type: 'boolean',
        value: false
      },
      person: {
        set(value, setValue) {
          if (!value) {
            return;
          }
          setValue(value);
          this.loadTasks();
        },
      },
      stateCss: {
        get: function () {
          if (this.attr('tasksAmount') === 0) {
            return baseCmpName + '__empty-state';
          }
          return this.attr('hasOverdue') ? baseCmpName + '__overdue-state' : '';
        }
      }
    },
    loadTasks: function () {
      let id = this.attr('person.id');
      let user = CMS.Models.Person.findInCacheById(id);

      if (!user) {
        user = new CMS.Models.Person(this.attr('person'));
      }
      return user.getTasksCount()
        .then(function (results) {
          this.attr('tasksAmount', results.open_task_count);
          this.attr('hasOverdue', results.has_overdue);
        }.bind(this));
    },
  },
  events: {
    onModelChange: function (model, event, instance) {
      if (instance instanceof CMS.Models.CycleTaskGroupObjectTask) {
        this.viewModel.loadTasks();
      }
    },
    '{CMS.Models.CycleTaskGroupObjectTask} updated': 'onModelChange',
    '{CMS.Models.CycleTaskGroupObjectTask} destroyed': 'onModelChange',
    '{CMS.Models.CycleTaskGroupObjectTask} created': 'onModelChange'
  }
});
