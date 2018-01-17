/*
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {BUTTON_VIEW_SAVE_CANCEL} from '../../../../ggrc/assets/javascripts/plugins/utils/modals';

let CloneTaskGroup = can.Model.Cacheable({
  defaults: {
    clone_objects: true,
    clone_tasks: true,
    clone_people: true
  }
}, {
  refresh: function () {
    return $.when(this);
  },
  save: function () {
    var task_group = new CMS.Models.TaskGroup({
      clone: this.source_task_group.id,
      context: null,
      clone_objects: this.clone_objects,
      clone_tasks: this.clone_tasks,
      clone_people: this.clone_people
    });

    return task_group.save();
  }
});

can.Component.extend({
  tag: "task-group-clone",
  template: "<content/>",
  events: {
    click: function (el) {
      var $target;

      $target = $('<div class="modal hide"></div>').uniqueId();
      $target.modal_form({}, el);
      import(/* webpackChunkName: "modalsCtrls" */'../../../../ggrc/assets/javascripts/controllers/modals')
        .then(() => {
          $target.ggrc_controllers_modals({
            modal_title: "Clone Task Group",
            model: CloneTaskGroup,
            instance: new CloneTaskGroup({source_task_group: this.scope.taskGroup}),
            content_view: GGRC.mustache_path + "/task_groups/clone_modal_content.mustache",
            custom_save_button_text: "Proceed",
            button_view: BUTTON_VIEW_SAVE_CANCEL
          });
        });
    }
  }
});
