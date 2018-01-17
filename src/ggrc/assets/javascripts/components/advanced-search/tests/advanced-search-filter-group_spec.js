/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as AdvancedSearch from '../../../plugins/utils/advanced-search-utils';
import Component from '../advanced-search-filter-group';

describe('GGRC.Components.advancedSearchFilterGroup', function () {
  'use strict';

  var viewModel;

  beforeEach(() => {
    viewModel = Component.prototype.viewModel();
  });

  describe('addFilterCriterion() method', function () {
    it('adds operator and attribute', function () {
      var items;
      viewModel.attr('items', [AdvancedSearch.create.attribute()]);
      viewModel.addFilterCriterion();

      items = viewModel.attr('items');
      expect(items.length).toBe(3);
      expect(items[0].type).toBe('attribute');
      expect(items[1].type).toBe('operator');
      expect(items[2].type).toBe('attribute');
    });
  });
});
