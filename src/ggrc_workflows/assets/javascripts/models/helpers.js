/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

(function (can, $, CMS) {
  can.Observe('CMS.ModelHelpers.CycleTask', {
    findInCacheById: function () {
      return null;
    }
  }, {
    init: function () {
      this.attr('owners', new CMS.Models.Person.List(this.owners));
    },
    save: function () {
      var Task;

      // FIXME: temporary fix for 'Could not get any raw data while
      // converting using .models'
      this._data.owners = $.map(this._data.owners, function (owner) {
        return {
          id: owner.id,
          type: owner.type
        };
      });

      Task = new CMS.Models.TaskGroupTask({
        task_group: this.task_group,
        title: this.title,
        description: this.description,
        sort_index: Number.MAX_SAFE_INTEGER / 2,
        contact: this.contact,
        context: this.context
      });

      return Task.save()
        .then(function (taskGroupTask) {
          var CycleTask = new CMS.Models.CycleTaskGroupObjectTask({
            cycle: this.cycle,
            start_date: this.cycle.reify().start_date,
            end_date: this.cycle.reify().end_date,
            task_group_task: taskGroupTask,
            sort_index: this.sort_index,
            title: this.title,
            description: this.description,
            status: 'Assigned',
            contact: this.contact,
            context: this.context
          });
          return CycleTask.save();
        }.bind(this));
    },
    computed_errors: function () {
      var errors = null;
      if (!this.attr('title')) {
        errors = {
          title: 'Must be defined'
        };
      }
      return errors;
    }
  });
})(window.can, window.can.$, window.CMS);
