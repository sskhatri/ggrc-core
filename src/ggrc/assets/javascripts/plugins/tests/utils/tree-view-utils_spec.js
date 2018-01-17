/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as module from '../../../plugins/utils/tree-view-utils';

describe('TreeViewUtils module', function () {
  'use strict';

  var method;
  var origPageType;

  beforeAll(function () {
    origPageType = GGRC.pageType;
    GGRC.pageType = 'MY_WORK';
  });

  afterAll(function () {
    GGRC.pageType = origPageType;
  });

  describe('getColumnsForModel() method', function () {
    var origCustomAttrDefs;
    var origRoleList;
    var origAttrs;

    beforeAll(function () {
      method = module.getColumnsForModel;

      origRoleList = GGRC.access_control_roles;
      origAttrs = [].concat(CMS.Models.CycleTaskGroupObjectTask
        .tree_view_options.display_attr_names);
      GGRC.access_control_roles = [
        {id: 5, name: 'Role 5', object_type: 'Market'},
        {id: 9, name: 'Role 9', object_type: 'Audit'},
        {id: 1, name: 'Role 1', object_type: 'Market'},
        {id: 7, name: 'Role 7', object_type: 'Policy'},
        {id: 3, name: 'Role 3', object_type: 'Audit'},
        {id: 2, name: 'Role 2', object_type: 'Policy'},
      ];

      origCustomAttrDefs = GGRC.custom_attr_defs;
      GGRC.custom_attr_defs = [{
        id: 16, attribute_type: 'Text',
        definition_type: 'market', title: 'CA def 16'
      }, {
        id: 5, attribute_type: 'Text',
        definition_type: 'policy', title: 'CA def 5'
      }, {
        id: 11, attribute_type: 'Text',
        definition_type: 'audit', title: 'CA def 11'
      }];
    });

    afterAll(function () {
      GGRC.access_control_roles = origRoleList;
      GGRC.custom_attr_defs = origCustomAttrDefs;
      CMS.Models.CycleTaskGroupObjectTask
        .tree_view_options.display_attr_names =
          origAttrs;
    });

    it('includes custom roles info in the result ', function () {
      var result = method('Audit', null);
      result = _.filter(result.available, {attr_type: 'role'});

      ['Role 3', 'Role 9'].forEach(function (title) {
        var expected = {
          attr_type: 'role',
          attr_title: 'Role 9',
          attr_name: 'Role 9',
          attr_sort_field: 'Role 9'
        };
        expect(result).toContain(jasmine.objectContaining(expected));
      });
    });
  });

  describe('getSortingForModel() method', function () {
    var noDefaultSortingModels = [
      'Cycle',
      'TaskGroup',
      'TaskGroupTask',
      'CycleTaskGroupObjectTask',
    ];

    it('returns default sorting configuration', function () {
      let result = module.getSortingForModel('Audit');

      expect(result).toEqual({key: 'updated_at', direction: 'desc'});
    });

    it('returns empty sorting configuration', function () {
      noDefaultSortingModels.forEach((model) => {
        let result = module.getSortingForModel(model);

        expect(result).toEqual({key: null, direction: null});
      });
    });
  });

  describe('getModelsForSubTier() method', function () {
    var baseWidgetsByType;
    var origFilter;

    beforeAll(function () {
      baseWidgetsByType = GGRC.tree_view.attr('base_widgets_by_type');
      origFilter = CMS.Models.CycleTaskGroupObjectTask
        .sub_tree_view_options.default_filter;

      GGRC.tree_view.attr('base_widgets_by_type', {
        CycleTaskGroupObjectTask: ['Audit', 'Program'],
      });
    });

    afterAll(function () {
      GGRC.tree_view.attr('base_widgets_by_type', baseWidgetsByType);
      CMS.Models.CycleTaskGroupObjectTask
        .sub_tree_view_options.default_filter = origFilter;
    });

    it('gets selected models from model\'s default_filter when available',
    function () {
      var result;

      CMS.Models.CycleTaskGroupObjectTask
        .sub_tree_view_options.default_filter = ['Audit'];

      result = module.getModelsForSubTier('CycleTaskGroupObjectTask');
      expect(result.available.length).toEqual(2);
      expect(result.selected.length).toEqual(1);
      expect(result.selected[0]).toEqual('Audit');
    });

    it('returns all available models as selected when ' +
      'model\'s default_filter is not available', function () {
      var result;

      CMS.Models.CycleTaskGroupObjectTask
        .sub_tree_view_options.default_filter = null;

      result = module.getModelsForSubTier('CycleTaskGroupObjectTask');
      expect(result.available.length).toEqual(2);
      expect(result.selected.length).toEqual(2);
    });
  });
});
