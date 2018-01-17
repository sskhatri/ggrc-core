  /*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import workflowHelpers from './workflow-helpers';
import {
  initCounts,
} from '../../../../ggrc/assets/javascripts/plugins/utils/current-page-utils';

export default can.Component.extend({
  tag: 'workflow-activate',
  template: '<content/>',
  init: function () {
    this.scope._can_activate_def();
  },
  scope: {
    waiting: true,
    can_activate: false,
    _can_activate_def: function () {
      var self = this;
      var workflow = GGRC.page_instance();

      self.attr('waiting', true);
      $.when(
        workflow.refresh_all('task_groups', 'task_group_objects'),
        workflow.refresh_all('task_groups', 'task_group_tasks')
      )
      .always(function () {
        self.attr('waiting', false);
      })
      .done(function () {
        var taskGroups = workflow.task_groups.reify();
        var canActivate = taskGroups.length;

        taskGroups.each(function (taskGroup) {
          if (!taskGroup.task_group_tasks.length) {
            canActivate = false;
          }
        });
        self.attr('can_activate', canActivate);
      })
      .fail(function (error) {
        console.warn('Workflow activate error', error.message);
      });
    },
    _handle_refresh: function (model) {
      var models = ['TaskGroup', 'TaskGroupTask', 'TaskGroupObject'];
      if (models.indexOf(model.shortName) > -1) {
        this._can_activate_def();
      }
    },
    _restore_button: function () {
      this.attr('waiting', false);
    },
    _activate: function () {
      var workflow = GGRC.page_instance();
      var scope = this;
      var restoreButton = scope._restore_button.bind(scope);

      scope.attr('waiting', true);
      if (workflow.unit !== null) {
        workflow.refresh()
          .then(function () {
            workflow.attr('recurrences', true);
            workflow.attr('status', 'Active');
            return workflow.save();
          })
          .then(function (workflow) {
            if (moment(workflow.next_cycle_start_date)
                .isSame(moment(), 'day')) {
              return new CMS.Models.Cycle({
                context: workflow.context.stub(),
                workflow: {id: workflow.id, type: 'Workflow'},
                autogenerate: true,
              }).save();
            }
          })
          .then(function () {
            var WorkflowExtension =
              _.find(GGRC.extensions, function (extension) {
                return extension.name === 'workflows';
              });

            return initCounts([
                WorkflowExtension.countsMap.activeCycles,
              ],
                workflow.type,
                workflow.id);
          })
          .then(function () {
            return workflow.refresh_all('task_groups', 'task_group_tasks');
          })
          .always(restoreButton);
      } else {
        workflowHelpers.generateCycle(workflow)
          .then(function () {
            return workflow.refresh();
          })
          .then(function (workflow) {
            return workflow.attr('status', 'Active').save();
          })
          .always(restoreButton);
      }
    },
  },
  events: {
    '{can.Model.Cacheable} created': function (model) {
      this.scope._handle_refresh(model);
    },
    '{can.Model.Cacheable} destroyed': function (model) {
      this.scope._handle_refresh(model);
    },
    'button click': function () {
      this.scope._activate();
    },
  },
});
