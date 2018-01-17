/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as AdvancedSearch from '../../../plugins/utils/advanced-search-utils';
import Component from '../advanced-search-mapping-group';

describe('GGRC.Components.advancedSearchMappingGroup', function () {
  'use strict';

  var viewModel;

  beforeEach(() => {
    viewModel = new Component.prototype.viewModel();
  });

  describe('addMappingCriteria() method', function () {
    it('adds operator and criteria', function () {
      var items;
      viewModel.attr('items',
        [AdvancedSearch.create.mappingCriteria()]);
      viewModel.addMappingCriteria();

      items = viewModel.attr('items');
      expect(items.length).toBe(3);
      expect(items[0].type).toBe('mappingCriteria');
      expect(items[1].type).toBe('operator');
      expect(items[2].type).toBe('mappingCriteria');
    });
  });
});
