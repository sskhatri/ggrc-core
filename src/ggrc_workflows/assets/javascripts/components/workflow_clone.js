/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {BUTTON_VIEW_SAVE_CANCEL} from '../../../../ggrc/assets/javascripts/plugins/utils/modals';

let CloneWorkflow = can.Model.Cacheable({
  defaults : {
    clone_people: true,
    clone_tasks: true,
    clone_objects: true
  }
}, {
  refresh: function() {
    return $.when(this);
  },
  save: function() {
    var workflow = new CMS.Models.Workflow({
      clone: this.source_workflow.id,
      context: null,
      clone_people: this.clone_people,
      clone_tasks: this.clone_tasks,
      clone_objects: this.clone_objects
    });

    return workflow.save().then(function(workflow) {
      GGRC.navigate(workflow.viewLink);
      return this;
    });

  }
});

can.Component.extend({
  tag: "workflow-clone",
  template: "<content/>",
  events: {
    click: function(el) {
      var $target;

      $target = $('<div class="modal hide"></div>').uniqueId();
      $target.modal_form({}, el);
      import(/* webpackChunkName: "modalsCtrls" */'../../../../ggrc/assets/javascripts/controllers/modals')
        .then(() => {
          $target.ggrc_controllers_modals({
            modal_title: "Clone Workflow",
            model: CloneWorkflow,
            instance: new CloneWorkflow({source_workflow: this.scope.workflow}),
            content_view: GGRC.mustache_path + "/workflows/clone_modal_content.mustache",
            custom_save_button_text: "Proceed",
            button_view: BUTTON_VIEW_SAVE_CANCEL
          });
        });
    }
  }
});
