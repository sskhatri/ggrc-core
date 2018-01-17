/* !
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as TreeViewUtils from '../../../plugins/utils/tree-view-utils';

describe('GGRC.Components.mapperResultsColumnsConfiguration', function () {
  'use strict';
  var viewModel;

  beforeAll(function () {
    viewModel = GGRC.Components
      .getViewModel('mapperResultsColumnsConfiguration');
  });

  describe('set() of viewModel.selectedColumns', function () {
    beforeEach(function () {
      spyOn(viewModel, 'initializeColumns');
    });

    it('updates value of viewModel.selectedColumns', function () {
      viewModel.attr('selectedColumns', 123);
      expect(viewModel.attr('selectedColumns')).toEqual(123);
    });

    it('calls viewModel.initializeColumns()', function () {
      viewModel.attr('selectedColumns', 123);
      expect(viewModel.initializeColumns).toHaveBeenCalled();
    });
  });

  describe('set() of viewModel.availableColumns', function () {
    beforeEach(function () {
      spyOn(viewModel, 'initializeColumns');
    });

    it('updates value of viewModel.availableColumns',
      function () {
        viewModel.attr('availableColumns', 123);
        expect(viewModel.attr('availableColumns')).toEqual(123);
      });

    it('calls viewModel.initializeColumns()',
      function () {
        viewModel.attr('availableColumns', 123);
        expect(viewModel.initializeColumns).toHaveBeenCalled();
      });
  });

  describe('init() method', function () {
    var displayPrefs = 'displayPrefs';

    beforeEach(function () {
      spyOn(viewModel, 'initializeColumns');
      spyOn(CMS.Models.DisplayPrefs, 'getSingleton')
        .and.returnValue($.Deferred().resolve(displayPrefs));
    });

    it('calls initializeColumns()', function () {
      viewModel.init();
      expect(viewModel.initializeColumns).toHaveBeenCalled();
    });

    it('updates viewModel.displayPrefs', function () {
      viewModel.init();
      expect(viewModel.attr('displayPrefs'))
        .toEqual(displayPrefs);
    });
  });

  describe('getModel() method', function () {
    it('returns the current model type constructor', function () {
      var result;
      viewModel.attr('modelType', 'Program');
      result = viewModel.getModel();
      expect(result).toEqual(CMS.Models.Program);
    });
  });

  describe('initializeColumns() method', function () {
    var selectedColumns;
    var availableColumns;

    beforeAll(function () {
      selectedColumns = new can.makeArray([
        new can.Map({attr_name: 'title'})
      ]);
      availableColumns = new can.makeArray([
        new can.Map({attr_name: 'title'}),
        new can.Map({attr_name: 'date'})
      ]);
    });

    beforeEach(function () {
      viewModel.attr('selectedColumns', selectedColumns);
      viewModel.attr('availableColumns', availableColumns);
    });

    it('updates viewModel.columns', function () {
      var columns;
      viewModel.initializeColumns();
      columns = viewModel.attr('columns');
      expect(columns).toEqual(jasmine.objectContaining({
        title: true,
        date: false
      }));
    });
  });

  describe('onSelect() method', function () {
    beforeEach(function () {
      viewModel.attr('columns', new can.Map({
        title: true,
        date: false
      }));
    });

    it('changes column.attr()', function () {
      viewModel.onSelect({attr_name: 'date'});
      expect(viewModel.attr('columns'))
        .toEqual(jasmine.objectContaining({
          title: true,
          date: true
        }));
    });
  });

  describe('isSelected() method', function () {
    beforeEach(function () {
      viewModel.attr('columns', new can.Map({
        title: true,
        date: false
      }));
    });

    it('returns true if column is selected', function () {
      var result = viewModel.isSelected({attr_name: 'title'});
      expect(result).toEqual(true);
    });

    it('returns false if column is not selected', function () {
      var result = viewModel.isSelected({attr_name: 'date'});
      expect(result).toEqual(false);
    });
  });

  describe('setColumns() method', function () {
    beforeEach(function () {
      viewModel.attr('columns', new can.Map({
        title: true,
        date: false
      }));
      spyOn(TreeViewUtils, 'setColumnsForModel')
        .and.returnValue({
          selected: 'selectedColumns'
        });
    });

    it('updates value of viewModel.selectedColumns', function () {
      viewModel.setColumns();
      expect(viewModel.selectedColumns).toEqual('selectedColumns');
    });
  });

  describe('stopPropagation() method', function () {
    var event;

    beforeEach(function () {
      event = {
        stopPropagation: function () {}
      };
      spyOn(event, 'stopPropagation');
    });

    it('calls stopPropagation of event',
      function () {
        viewModel.stopPropagation({}, {}, event);
        expect(event.stopPropagation).toHaveBeenCalled();
      });
  });
});
