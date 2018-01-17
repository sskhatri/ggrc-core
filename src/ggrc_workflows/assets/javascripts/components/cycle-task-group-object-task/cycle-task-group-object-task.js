/* !
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './templates/cycle-task-group-object-task.mustache';
import '../../../../../ggrc/assets/javascripts/components/object-change-state/object-change-state';
import '../../../../../ggrc/assets/javascripts/components/dropdown/dropdown';
import RefreshQueue from '../../../../../ggrc/assets/javascripts/models/refresh_queue';

var viewModel = can.Map.extend({
  showLink: function () {
    var pageInstance = GGRC.page_instance();

    return pageInstance.type !== 'Workflow';
  },
  instance: {},
  initialState: 'Assigned',
  cycle: {},
  workflow: {},
  init: function () {
    this.loadCycle()
      .then(this.loadWorkflow.bind(this));
  },
  loadCycle: function () {
    var stubCycle = this.attr('instance.cycle').reify();
    var dfdResult;

    if (!_.isEmpty(stubCycle)) {
      dfdResult = new RefreshQueue()
        .enqueue(stubCycle)
        .trigger()
        .then(_.first)
        .then(function (cycle) {
          this.attr('cycle', cycle);
          return cycle;
        }.bind(this));
    } else {
      dfdResult = can.Deferred().reject();
    }

    return dfdResult;
  },
  loadWorkflow: function (cycle) {
    var workflow = cycle.attr('workflow').reify();

    return new RefreshQueue().enqueue(workflow)
      .trigger()
      .then(_.first)
      .then(function (loadedWorkflow) {
        this.attr('workflow', loadedWorkflow);
      }.bind(this));
  },
  onStateChange: function (event) {
    var instance = this.attr('instance');
    var newStatus = event.state;

    instance.refresh()
      .then(function (refreshed) {
        refreshed.attr('status', newStatus);
        return refreshed.save();
      });
  },
});

export default GGRC.Components('cycleTaskGroupObjectTask', {
  tag: 'cycle-task-group-object-task',
  template: template,
  viewModel: viewModel,
});
