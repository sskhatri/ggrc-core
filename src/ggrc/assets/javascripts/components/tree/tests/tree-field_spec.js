/*
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../tree-field';

describe('tree-field component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(Component);
  });

  describe('refreshItems() method', () => {
    it('sets empty result when nothing is uploaded', () => {
      spyOn(vm, 'getItems').and.returnValue(can.Deferred().resolve([]));
      vm.refreshItems();

      expect(vm.attr('items').length).toBe(0);
      expect(vm.attr('resultStr')).toBe('');
    });

    it('shows result for uploaded items', () => {
      spyOn(vm, 'getItems').and
        .returnValue(can.Deferred().resolve([
          {title: 'asd'},
          {title: 'sdf'},
        ]));
      vm.refreshItems();

      expect(vm.attr('items').length).toBe(2);
      expect(vm.attr('resultStr')).toBe('asd\nsdf');
    });

    it('adds "and more" text when limit exceeded', () => {
      spyOn(vm, 'getItems').and
        .returnValue(can.Deferred().resolve([
          {title: '1'},
          {title: '2'},
          {title: '3'},
          {title: '4'},
          {title: '5'},
          {title: '6'},
        ]));
      vm.refreshItems();

      expect(vm.attr('items').length).toBe(6);
      expect(vm.attr('resultStr')).toBe('1\n2\n3\n4\n5\n and 1 more');
    });
  });

  describe('getItems() method', () => {
    it('doesn\'t trigger \'loadItems\' for empty source', (done) => {
      vm.attr('source', []);
      spyOn(vm, 'loadItems');
      vm.getItems().then((result) => {
        expect(result.length).toBe(0);
        expect(vm.loadItems).not.toHaveBeenCalled();
        done();
      });
    });

    it('doesn\'t trigger \'loadItems\' for not defined source', (done) => {
      vm.attr('source', null);
      spyOn(vm, 'loadItems');
      vm.getItems().then((result) => {
        expect(result.length).toBe(0);
        expect(vm.loadItems).not.toHaveBeenCalled();
        done();
      });
    });

    it('triggers \'loadItems\' for items without required data', (done) => {
      let source = [{}, {}, {}];
      vm.attr('source', source);
      spyOn(vm, 'loadItems').and.returnValue(can.Deferred().resolve(source));
      vm.getItems().then((result) => {
        expect(result.length).toBe(3);
        expect(vm.loadItems).toHaveBeenCalled();
        done();
      });
    });

    it('doesn\'t trigger \'loadItems\' for items with required data',
    (done) => {
      let source = [{email: 'foo'}, {email: 'bar'}, {email: 'baz'}];
      vm.attr('field', 'email');
      vm.attr('source', source);
      spyOn(vm, 'loadItems').and.returnValue(can.Deferred().resolve(source));
      vm.getItems().then((result) => {
        expect(result.length).toBe(source.length);
        expect(vm.loadItems).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
