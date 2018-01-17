/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as StateUtils from '../../plugins/utils/state-utils';
import router from '../../router';

let viewModel = can.Map.extend({
  define: {
    operation: {
      type: String,
      value: 'AND',
    },
    depth: {
      type: Boolean,
      value: false,
    },
  },
  disabled: false,
  options: {},
  filters: null,
  filterStates: [],
  widgetId: null,
  modelName: null,
  displayPrefs: null,
  initializeFilter(states) {
    let statuses = this.attr('filterStates');
    statuses.forEach((item) => {
      item.attr('checked', (states.indexOf(item.value) > -1));
    });
    this.setFilter(states);
  },
  loadDefaultStates(modelName) {
    // Get the status list from local storage
    let savedStates = this.attr('displayPrefs').getTreeViewStates(modelName);
    // Get the status list from query string
    let queryStates = router.attr('state');

    let allStates = StateUtils.getStatesForModel(modelName);
    let defaultStates = (queryStates || savedStates).filter((state) => {
      return allStates.includes(state);
    });

    if (defaultStates.length === 0) {
      defaultStates = StateUtils.getDefaultStatesForModel(modelName);
    }

    return defaultStates;
  },
  saveTreeStates(selectedStates) {
    this.setFilter(selectedStates);

    let filterName = this.attr('widgetId') || this.attr('modelName');
    this.attr('displayPrefs').setTreeViewStates(filterName, selectedStates);
  },
  setFilter(selected) {
    let statuses = this.attr('filterStates');
    let filter = '';

    if (selected.length && statuses.length !== selected.length) {
      filter = StateUtils.statusFilter(selected, '', this.attr('modelName'));
      router.attr('state', selected);
    } else {
      router.removeAttr('state');
    }

    this.attr('options.filter', filter);
  },
});

export default can.Component.extend({
  tag: 'tree-status-filter',
  viewModel: viewModel,
  events: {
    inserted() {
      let vm = this.viewModel;
      let options = vm.attr('options');
      let filter = vm.attr('filter');
      let operation = vm.attr('operation');
      let depth = vm.attr('depth');
      let filterName = vm.attr('widgetId') || vm.attr('modelName');
      let filterStates = StateUtils.getStatesForModel(vm.attr('modelName'))
        .map((state) => {
          return {
            value: state,
          };
        });

      options.attr('filter', filter);
      options.attr('operation', operation);
      options.attr('depth', depth);
      options.attr('name', 'status');

      if (vm.registerFilter) {
        vm.registerFilter(options);
      }

      vm.attr('filterStates', filterStates);

      CMS.Models.DisplayPrefs.getSingleton().then((displayPrefs) => {
        vm.attr('displayPrefs', displayPrefs);

        let defaultStates = vm.loadDefaultStates(filterName);
        vm.initializeFilter(defaultStates);

        // Start listening route events only after full initialization.
        vm.attr('router', router);
      });
    },
    'multiselect-dropdown multiselect:closed'(el, ev, selected) {
      ev.stopPropagation();
      let selectedStates = selected.map((state) => state.value);

      this.viewModel.saveTreeStates(selectedStates);
    },
    '{viewModel} disabled'() {
      if (this.viewModel.attr('disabled')) {
        this.viewModel.attr('selectedStates', []);
      } else {
        this.viewModel.loadTreeStates(this.viewModel.attr('modelName'));
      }
    },
    '{viewModel.router} state'(router, event, newValue) {
      let states = newValue ||
        this.viewModel.attr('filterStates').map((state) => state.value);

      this.viewModel.initializeFilter(states);
      this.viewModel.dispatch('filter');
    },
  },
});
