/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from './multi-select-label';

describe('multi-select-label component', () => {
  let vm;
  beforeEach(() => {
    vm = getComponentVM(Component);
  });

  describe('onlyEditMode setter', () => {
    it('sets true to editMode attribute if setted value is true', () => {
      vm.attr('editMode', false);
      vm.attr('onlyEditMode', true);

      expect(vm.attr('editMode')).toBe(true);
    });

    it('sets labelsBackup with new list of labels if value is true', () => {
      let labels = new can.List([1, 2, 3]);
      vm.attr('instance', {
        labels: labels,
      });
      vm.attr('onlyEditMode', true);

      expect(vm.attr('labelsBackup').serialize()).toEqual(labels.serialize());
      expect(vm.attr('labelsBackup')).not.toEqual(labels);
    });

    it('does not change value of editMode attribute if setted value is false',
    () => {
      vm.attr('editMode', false);
      vm.attr('onlyEditMode', false);
      expect(vm.attr('editMode')).toBe(false);

      vm.attr('editMode', true);
      vm.attr('onlyEditMode', false);
      expect(vm.attr('editMode')).toBe(true);
    });
  });

  describe('_labels getter', () => {
    it('returns array of labels with indexes in "_index" field', () => {
      let labels = [{name: '1'}, {name: '2'}, {name: '3'}];
      let _labels;

      vm.attr('labels', labels);
      _labels = vm.attr('_labels');

      _labels.forEach((item, index) => {
        let expectedItem = {
          name: labels[index].name,
          _index: index,
        };
        expect(item).toEqual(jasmine.objectContaining(expectedItem));
      });
    });
  });
});
