/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../tree-status-filter';
import * as StateUtils from '../../../plugins/utils/state-utils';
import router from '../../../router';


describe('treeStatusFilter', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = new Component.prototype.viewModel();
  });

  describe('setFilter() method', () => {
    const FILTER_STRING = 'Foo Bar Baz';
    beforeEach(() => {
      viewModel.attr('filterStates', [
        {value: 'A'},
        {value: 'B'},
        {value: 'C'},
      ]);
      spyOn(StateUtils, 'statusFilter').and.returnValue(FILTER_STRING);
    });

    it('set empty when all statuses selected', () => {
      viewModel.setFilter(['A', 'B', 'C']);

      expect(viewModel.attr('options.filter')).toEqual('');
    });

    it('set empty when no status selected', () => {
      viewModel.setFilter([]);

      expect(viewModel.attr('options.filter')).toEqual('');
    });

    it('set not empty when some status selected', () => {
      viewModel.setFilter(['A']);

      expect(viewModel.attr('options.filter')).toEqual(FILTER_STRING);
    });

    it('write states to query string property', () => {
      let statuses = ['A'];

      viewModel.setFilter(statuses);

      let result = router.attr('state').attr();
      expect(result).toEqual(statuses);
    });

    it('clear query string property when there are no states', () => {
      let statuses = [];
      router.attr('state', ['A']);

      viewModel.setFilter(statuses);

      let result = router.attr('state');
      expect(result).toBeUndefined();
    });

    it('clear query string property when selected all states', () => {
      let statuses = ['A', 'B', 'C'];
      router.attr('state', ['A']);

      viewModel.setFilter(statuses);

      let result = router.attr('state');
      expect(result).toBeUndefined();
    });
  });

  describe('initializeFilter() mthod', () => {
    beforeEach(() => {
      viewModel.attr('filterStates', [
        {value: 'A', checked: false},
        {value: 'B', checked: false},
        {value: 'C', checked: false},
      ]);
      spyOn(viewModel, 'setFilter');
    });

    it('makes provided options checked', ()=> {
      viewModel.initializeFilter(['A', 'C']);

      expect(viewModel.attr('filterStates').serialize()).toEqual([
        {value: 'A', checked: true},
        {value: 'B', checked: false},
        {value: 'C', checked: true},
      ]);
    });

    it('set passed filters', () => {
      viewModel.initializeFilter(['A', 'C']);

      expect(viewModel.setFilter).toHaveBeenCalledWith(['A', 'C']);
    });
  });

  describe('saveTreeStates() method', () => {
    const filters = ['A', 'B'];
    beforeEach(() => {
      let displayPrefs = jasmine.createSpyObj(['setTreeViewStates']);
      viewModel.attr('displayPrefs', displayPrefs);

      spyOn(viewModel, 'setFilter');
    });

    it('set passed filters', () => {
      viewModel.saveTreeStates(filters);

      expect(viewModel.setFilter).toHaveBeenCalledWith(filters);
    });

    describe('saves filter to display preferences', () => {
      it('if widgetId is provided', () => {
        viewModel.attr('widgetId', 'testId');

        viewModel.saveTreeStates(filters);

        expect(viewModel.attr('displayPrefs').setTreeViewStates)
          .toHaveBeenCalledWith('testId', filters);
      });

      it('if modelName is provided', () => {
        viewModel.attr('modelName', 'testName');

        viewModel.saveTreeStates(filters);

        expect(viewModel.attr('displayPrefs').setTreeViewStates)
          .toHaveBeenCalledWith('testName', filters);
      });
    });
  });

  describe('loadDefaultStates() method', () => {
    let savedFilters;
    beforeEach(() => {
      savedFilters = new can.List(['c', 'd']);
      spyOn(savedFilters, 'filter').and.returnValue(['c']);

      viewModel.attr('displayPrefs', {
        getTreeViewStates: jasmine.createSpy().and.returnValue(savedFilters),
      });
    });

    it('use filter set from query if it is presented', () => {
      let queryFilters = new can.List(['a', 'b']);
      spyOn(queryFilters, 'filter').and.returnValue(['a']);
      router.attr('state', queryFilters);

      viewModel.loadDefaultStates();

      expect(queryFilters.filter).toHaveBeenCalled();
    });

    it('use saved filters if set from query is not presented', () => {
      router.removeAttr('state');

      viewModel.loadDefaultStates();

      expect(savedFilters.filter).toHaveBeenCalled();
    });
  });

  describe('"{viewModel.router} state" event handler', () => {
    let handler;
    beforeEach(() => {
      handler = Component.prototype.events['{viewModel.router} state'].bind({
        viewModel,
      });
      spyOn(viewModel, 'initializeFilter');
      spyOn(viewModel, 'dispatch');
      viewModel.attr('filterStates', [
        {value: 'A'},
        {value: 'B'},
      ]);
    });

    describe('when new value was added', () => {
      beforeEach(() => {
        handler(null, null, ['A']);
      });

      it('initializes states', () => {
        expect(viewModel.initializeFilter).toHaveBeenCalledWith(['A']);
      });

      it('dispatches "filter" event', () => {
        expect(viewModel.dispatch).toHaveBeenCalledWith('filter');
      });
    });

    describe('when value was removed', () => {
      beforeEach(() => {
        handler(null, null, null);
      });

      it('initializes states', () => {
        expect(viewModel.initializeFilter.calls.argsFor(0)[0].attr())
          .toEqual(['A', 'B']);
      });

      it('dispatches "filter" event', () => {
        expect(viewModel.dispatch).toHaveBeenCalledWith('filter');
      });
    });
  });
});
