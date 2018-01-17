/*
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import childModelsMap from '../child-models-map';

describe('childModelsMap object', () => {
  afterEach(() => {
    childModelsMap.attr('container', {});
  });

  describe('getChildModels() method', () => {
    let types = ['Program', 'System', 'Assessment'];
    let spy;

    beforeEach(() => {
      spy = spyOn(childModelsMap.displayPrefs, 'getChildTreeDisplayList');
    });

    describe('if childModelsMap has no field for specified type', () => {
      it('gets saved childModels for specified type from localStorage', () => {
        let expectedResult = {};
        let returnValue;

        types.forEach((type) => {
          returnValue = 'child_models_for_' + type;
          spy.and.returnValue(returnValue);

          childModelsMap.getModels(type);

          expect(spy).toHaveBeenCalledWith(type);
          expectedResult[type] = returnValue;
        });

        expect(childModelsMap.attr('container').serialize())
          .toEqual(expectedResult);
        expect(spy.calls.count()).toEqual(3);
      });

      it('returns childModels for specified type', () => {
        let type = 'Program';
        let expectedResult = 'child_models_for_Program';
        spy.and.returnValue('child_models_for_Program');

        expect(childModelsMap.getModels(type)).toEqual(expectedResult);
      });
    });

    describe('if childModelsMap has field for specified type', () => {
      it('does not calls getChildTreeDisplayList method', () => {
        let spy = childModelsMap.displayPrefs.getChildTreeDisplayList;

        types.forEach((type) => {
          childModelsMap.attr('container')
            .attr(type, 'child_models_for_' + type);

          childModelsMap.getModels(type);
        });

        expect(spy.calls.count()).toEqual(0);
      });
    });
  });

  describe('setModels() method', () => {
    let types = ['Program', 'System', 'Assessment'];
    let expectedResult;

    beforeEach(() => {
      expectedResult = {};
      spyOn(childModelsMap.displayPrefs, 'setChildTreeDisplayList');
      types.forEach((type) => {
        childModelsMap.attr('container')
          .attr(type, 'old_child_models_for_' + type);
        expectedResult[type] = 'old_child_models_for_' + type;
      });
    });

    it('sets newModels to container by parentType', () => {
      let type = 'Program';

      childModelsMap.setModels(type, 'new_child_models_for_' + type);
      expectedResult[type] = 'new_child_models_for_' + type;

      expect(childModelsMap.attr('container').serialize())
        .toEqual(expectedResult);
    });

    it('calls displayPrefs.setChildTreeDisplayList() ' +
    ' with parentType and newModels as parameters', () => {
      let type = 'Program';
      let newModels = 'childs_for_Program';
      childModelsMap.setModels(type, newModels);

      expect(childModelsMap.displayPrefs.setChildTreeDisplayList)
        .toHaveBeenCalledWith(type, newModels);
    });
  });
});
