/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as StateUtils from '../../plugins/utils/state-utils';
import {getColumnsForModel} from '../../plugins/utils/tree-view-utils';
import * as AdvancedSearch from '../../plugins/utils/advanced-search-utils';

export default can.Component.extend({
  tag: 'advanced-search-wrapper',
  viewModel: can.Map.extend({
    define: {
      hasStatusFilter: {
        get: function () {
          return StateUtils.hasFilter(this.attr('modelName'));
        },
      },
    },
    modelName: null,
    modelDisplayName: null,
    filterItems: [AdvancedSearch.create.attribute()],
    mappingItems: [],
    statusItem: AdvancedSearch.create.state(),
    relevantTo: [],
    availableAttributes: function () {
      var available = getColumnsForModel(
        this.attr('modelName'),
        null,
        true
      ).available;
      return available;
    },
    addFilterAttribute: function () {
      var items = this.attr('filterItems');
      if (items.length) {
        items.push(AdvancedSearch.create.operator('AND'));
      }
      items.push(AdvancedSearch.create.attribute());
    },
    addMappingFilter: function () {
      var items = this.attr('mappingItems');
      if (items.length) {
        items.push(AdvancedSearch.create.operator('AND'));
      }
      items.push(AdvancedSearch.create.mappingCriteria());
    },
    resetFilters: function () {
      this.attr('filterItems', [AdvancedSearch.create.attribute()]);
      this.attr('mappingItems', []);
      this.attr('statusItem.value', {});
    },
  }),
  events: {
    '{viewModel} modelName': function () {
      this.viewModel.resetFilters();
    },
  },
});
