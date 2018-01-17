/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {confirm} from '../../../../ggrc/assets/javascripts/plugins/utils/modals';

export default {
  generateCycle: function (workflow) {
    var dfd = new $.Deferred();
    var cycle;

    confirm({
      modal_title: 'Confirm',
      modal_confirm: 'Proceed',
      skip_refresh: true,
      button_view: GGRC.mustache_path +
        '/workflows/confirm_start_buttons.mustache',
      content_view: GGRC.mustache_path +
        '/workflows/confirm_start.mustache',
      instance: workflow,
    }, function (params, option) {
      var data = {};

      can.each(params, function (item) {
        data[item.name] = item.value;
      });

      cycle = new CMS.Models.Cycle({
        context: workflow.context.stub(),
        workflow: {id: workflow.id, type: 'Workflow'},
        autogenerate: true,
      });

      cycle.save().then(function (cycle) {
        // Cycle created. Workflow started.
        setTimeout(function () {
          dfd.resolve();
          window.location.hash = 'current_widget/cycle/' + cycle.id;
        }, 250);
      });
    }, function () {
      dfd.reject();
    });
    return dfd;
  },
};
