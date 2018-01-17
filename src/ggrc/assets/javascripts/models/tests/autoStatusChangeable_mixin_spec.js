/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as ModalsUtils from '../../plugins/utils/modals';

describe('CMS.Models.Mixins.autoStatusChangeable', function () {
  'use strict';

  var Mixin;

  beforeAll(function () {
    Mixin = CMS.Models.Mixins.autoStatusChangeable;
  });

  describe('confirmBeginEdit() method', function () {
    var instance;
    var method;

    beforeEach(function () {
      instance = new can.Map({
        type: 'MyModel',
        status: 'Not Started'
      });
      method = Mixin.prototype.confirmBeginEdit.bind(instance);

      spyOn(ModalsUtils, 'confirm');
    });

    it('displays a confirmation dialog with correct texts', function () {
      var callArgs;
      var expectedBodyText;
      var expectedTitle;
      var modalOptions;
      var spy;

      instance.attr('type', 'MagicType');
      instance.attr('status', 'In Limbo');

      method();

      spy = ModalsUtils.confirm;
      expect(spy).toHaveBeenCalled();

      callArgs = spy.calls.first().args;
      modalOptions = callArgs[0];

      expectedTitle = 'Confirm moving MagicType to "In Progress"';
      expect(modalOptions.modal_title).toEqual(expectedTitle);

      expectedBodyText = [
        'If you modify a value, the status of the MagicType will move',
        'from "In Limbo" to "In Progress" - are you sure about that?'
      ].join(' ');
      expect(modalOptions.modal_description).toEqual(expectedBodyText);
    });

    it('resolves the given promise if the dialog gets confimred', function () {
      var callArgs;
      var confirmCallback;
      var promise;
      var spy;

      instance.attr('status', 'In Limbo');

      promise = method();

      spy = ModalsUtils.confirm;
      expect(spy).toHaveBeenCalled();

      callArgs = spy.calls.first().args;
      confirmCallback = callArgs[1];

      expect(promise.state()).not.toEqual(
        'resolved',
        'The promise was resolved too early.'
      );
      confirmCallback();
      expect(promise.state()).toEqual('resolved');
    });

    it('rejects the given promise if the dialog gets cancelled', function () {
      var callArgs;
      var rejectCallback;
      var promise;
      var spy;

      instance.attr('status', 'In Limbo');

      promise = method();

      spy = ModalsUtils.confirm;
      expect(spy).toHaveBeenCalled();

      callArgs = spy.calls.first().args;
      rejectCallback = callArgs[2];

      expect(promise.state()).not.toEqual(
        'rejected',
        'The promise was rejected too early.'
      );
      rejectCallback();
      expect(promise.state()).toEqual('rejected');
    });

    it('returns a resolved promise if in "In Progress" state without ' +
      'opening the modal',
      function () {
        var promise;
        var spy = ModalsUtils.confirm;

        instance.attr('status', 'In Progress');
        promise = method();

        expect(promise.state()).toEqual('resolved');
        expect(spy).not.toHaveBeenCalled();
      }
    );

    it('returns a resolved promise if in "Not Started" state without ' +
      'opening the modal',
      function () {
        var promise;
        var spy = ModalsUtils.confirm;

        instance.attr('status', 'Not Started');
        promise = method();

        expect(promise.state()).toEqual('resolved');
        expect(spy).not.toHaveBeenCalled();
      }
    );
  });
});
