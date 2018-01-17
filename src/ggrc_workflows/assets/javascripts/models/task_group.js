/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  can.Model.Cacheable('CMS.Models.TaskGroup', {
    root_object: 'task_group',
    root_collection: 'task_groups',
    category: 'workflow',
    findAll: 'GET /api/task_groups',
    findOne: 'GET /api/task_groups/{id}',
    create: 'POST /api/task_groups',
    update: 'PUT /api/task_groups/{id}',
    destroy: 'DELETE /api/task_groups/{id}',
    mixins: ['contactable'],
    permalink_options: {
      url: '<%= base.viewLink %>#task_group_widget/' +
      'task_group/<%= instance.id %>',
      base: 'workflow'
    },
    attributes: {
      workflow: 'CMS.Models.Workflow.stub',
      task_group_tasks: 'CMS.Models.TaskGroupTask.stubs',
      tasks: 'CMS.Models.Task.stubs',
      task_group_objects: 'CMS.Models.TaskGroupObject.stubs',
      objects: 'CMS.Models.get_stubs',
      modified_by: 'CMS.Models.Person.stub',
      context: 'CMS.Models.Context.stub',
      end_date: 'date'
    },

    tree_view_options: {
      sort_property: 'sort_index',
      attr_view: GGRC.mustache_path + '/task_groups/tree-item-attr.mustache',
      add_item_view: GGRC.mustache_path + '/task_groups/tree_add_item.mustache',
      mapper_attr_list: [
        {attr_title: 'Summary', attr_name: 'title'},
        {attr_title: 'Assignee', attr_name: 'assignee',
          attr_sort_field: 'contact'}
      ],
      disable_columns_configuration: true
    },

    init: function () {
      var that = this;
      if (this._super) {
        this._super.apply(this, arguments);
      }
      this.validateNonBlank('title');
      this.validateNonBlank('contact');
      this.validateNonBlank('workflow');
      this.validateContact(['_transient.contact', 'contact']);

      // Refresh workflow people:
      this.bind('created', function (ev, instance) {
        if (instance instanceof that) {
          instance.refresh_all_force('workflow', 'context');
        }
      });
      this.bind('updated', function (ev, instance) {
        if (instance instanceof that) {
          instance.refresh_all_force('workflow', 'context');
        }
      });
      this.bind('destroyed', function (ev, inst) {
        if (inst instanceof that) {
          can.each(inst.task_group_tasks, function (tgt) {
            if (!tgt) {
              return;
            }
            tgt = tgt.reify();
            can.trigger(tgt, 'destroyed');
            can.trigger(tgt.constructor, 'destroyed', tgt);
          });
          inst.refresh_all_force('workflow', 'context');
        }
      });
    }
  }, {});

  can.Model.Cacheable('CMS.Models.TaskGroupTask', {
    root_object: 'task_group_task',
    root_collection: 'task_group_tasks',
    findAll: 'GET /api/task_group_tasks',
    create: 'POST /api/task_group_tasks',
    update: 'PUT /api/task_group_tasks/{id}',
    destroy: 'DELETE /api/task_group_tasks/{id}',

    mixins: ['contactable', 'timeboxed', 'accessControlList'],
    permalink_options: {
      url: '<%= base.viewLink %>#task_group_widget/' +
      'task_group/<%= instance.task_group.id %>',
      base: 'task_group:workflow'
    },
    attributes: {
      context: 'CMS.Models.Context.stub',
      modified_by: 'CMS.Models.Person.stub',
      task_group: 'CMS.Models.TaskGroup.stub'
    },
    tree_view_options: {
      attr_view: GGRC.mustache_path +
        '/task_group_tasks/tree-item-attr.mustache',
      mapper_attr_list: [
        {attr_title: 'Summary', attr_name: 'title'},
      ],
      disable_columns_configuration: true,
      assigneeRoleName: 'Task Assignees',
    },

    init: function () {
      var that = this;
      var assigneeRole = _.find(GGRC.access_control_roles, {
        object_type: 'TaskGroupTask',
        name: 'Task Assignees',
      });

      if (this._super) {
        this._super.apply(this, arguments);
      }
      this.validateNonBlank('title');

      // instance.attr('access_control_list')
      //   .replace(...) doesn't raise change event
      // that's why we subscribe on access_control_list.length
      this.validate('access_control_list.length', function () {
        var that = this;
        var hasAssignee = assigneeRole && _.some(that.access_control_list, {
          ac_role_id: assigneeRole.id,
        });

        if (!hasAssignee) {
          return 'No valid contact selected for assignee';
        }
      });

      this.validate(['start_date', 'end_date'], function () {
        var that = this;
        var workflow = GGRC.page_instance();
        var datesAreValid = true;
        var startDate = GGRC.Date.getDate(that.attr('start_date'));
        var endDate = GGRC.Date.getDate(that.attr('end_date'));

        if (!(workflow instanceof CMS.Models.Workflow)) {
          return;
        }

        // Handle cases of a workflow with start and end dates
        datesAreValid = startDate && endDate &&
          startDate <= endDate;

        if (!datesAreValid) {
          return 'Start and/or end date is invalid';
        }
      });

      this.bind('created', function (ev, instance) {
        if (instance instanceof that) {
          if (instance.task_group.reify().selfLink) {
            instance.task_group.reify().refresh();
            instance._refresh_workflow_people();
          }
        }
      });

      this.bind('updated', function (ev, instance) {
        if (instance instanceof that) {
          instance._refresh_workflow_people();
        }
      });

      this.bind('destroyed', function (ev, instance) {
        if (instance instanceof that) {
          if (instance.task_group && instance.task_group.reify().selfLink) {
            instance.task_group.reify().refresh();
            instance._refresh_workflow_people();
          }
        }
      });
    }
  }, {
    init: function () {
      // default start and end date
      var startDate = this.attr('start_date') || new Date();
      var endDate = this.attr('end_date') ||
        new Date(moment().add(7, 'days').format());
      if (this._super) {
        this._super.apply(this, arguments);
      }
      // Add base values to this property
      this.attr('response_options', []);
      this.attr('start_date', startDate);
      this.attr('end_date', endDate);
      this.attr('minStartDate', new Date());

      this.bind('task_group', function (ev, newTask) {
        var task;
        var taskGroup;
        var props = [
          'relative_start_day',
          'relative_start_month',
          'relative_end_day',
          'relative_end_month',
          'start_date',
          'end_date'
        ];
        if (!newTask) {
          return;
        }
        newTask = newTask.reify();
        taskGroup = newTask.get_mapping('task_group_tasks').slice(0);

        do {
          task = taskGroup.splice(-1)[0];
          task = task && task.instance;
        } while (task === this);

        if (!task) {
          return;
        }
        can.each(props, function (prop) {
          if (task[prop] && !this[prop]) {
            this.attr(prop, task.attr(prop) instanceof Date ?
              new Date(task[prop]) :
              task[prop]);
          }
        }, this);
      });
    },

    _refresh_workflow_people: function () {
      //  TaskGroupTask assignment may add mappings and role assignments in
      //  the backend, so ensure these changes are reflected.
      var workflow;
      var taskGroup = this.task_group.reify();
      if (taskGroup.selfLink) {
        workflow = taskGroup.workflow.reify();
        return workflow.refresh().then(function (workflow) {
          return workflow.context.reify().refresh();
        });
      }
    }
  });
})(window.can, window.GGRC);
