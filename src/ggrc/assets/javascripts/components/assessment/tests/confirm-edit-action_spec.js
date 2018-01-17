/* !
   Copyright (C) 2017 Google Inc.
   Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as ModalsUtils from '../../../plugins/utils/modals';

describe('GGRC.Components.confirmEditAction', function () {
  var viewModel;

  beforeEach(function () {
    viewModel = GGRC.Components.getViewModel('confirmEditAction');
    viewModel.attr('instance', new CMS.Models.Assessment());
  });

  describe('openEditMode() method', function () {
    describe('if onStateChangeDfd is resolved then ', function () {
      beforeEach(function () {
        viewModel.attr('onStateChangeDfd', new can.Deferred().resolve());
      });

      it('dispatches setEditMode event if instance is in editable state',
      function () {
        spyOn(viewModel, 'isInEditableState').and.returnValue(true);
        spyOn(viewModel, 'dispatch');

        viewModel.openEditMode();

        expect(viewModel.dispatch).toHaveBeenCalledWith('setEditMode');
      });
    });
  });

  describe('isInEditableState() method', function () {
    it('returns true if instance state is ' +
    '"In Progress", "Not Started" or "Rework Needed"',
    function functionName() {
      ['In Progress', 'Not Started', 'Rework Needed'].forEach(function (state) {
        viewModel.attr('instance.status', state);

        expect(viewModel.isInEditableState()).toBe(true);
      });
    });

    it('returns false if instance state is not "In Progress" or "Not Started"',
    function () {
      ['In Review', 'Completed'].forEach(function (state) {
        viewModel.attr('instance.status', state);

        expect(viewModel.isInEditableState()).toBe(false);
      });
    });
  });

  describe('showConfirm() method', function () {
    var dfd;

    beforeEach(function () {
      dfd = new can.Deferred();
      spyOn(ModalsUtils, 'confirm');
      spyOn(can, 'Deferred').and.returnValue(dfd);
      spyOn(viewModel, 'dispatch');
      spyOn(viewModel, 'openEditMode');
    });

    it('returns promise', function (done) {
      dfd.resolve();

      viewModel.showConfirm().then(function () {
        done();
      });
    });

    it('initializes confirmation modal with correct options', function () {
      viewModel.attr('instance.status', 'In Review');

      viewModel.showConfirm();

      expect(ModalsUtils.confirm).toHaveBeenCalledWith({
        modal_title: 'Confirm moving Assessment to "In Progress"',
        modal_description: 'You are about to move Assessment from "' +
          'In Review' +
          '" to "In Progress" - are you sure about that?',
        button_view: GGRC.mustache_path + '/modals/prompt_buttons.mustache',
      }, jasmine.any(Function), jasmine.any(Function));
    });

    it('dispatches setInProgress if modal has been confirmed', function () {
      dfd.resolve();
      viewModel.attr('instance.status', 'In Review');

      viewModel.showConfirm();

      expect(viewModel.dispatch).toHaveBeenCalledWith('setInProgress');
    });

    it('opens edit mode if modal has been confirmed', function () {
      dfd.resolve();
      viewModel.attr('instance.status', 'In Review');

      viewModel.showConfirm();

      expect(viewModel.openEditMode).toHaveBeenCalled();
    });

    it('rejects Deferred if modal has been canceled', function () {
      var result;
      dfd.reject();

      result = viewModel.showConfirm();

      expect(result.state()).toBe('rejected');
    });
  });

  describe('confirmEdit() method', function () {
    beforeEach(function () {
      spyOn(viewModel, 'showConfirm').and.returnValue('mock');
      spyOn(viewModel, 'dispatch');
    });

    it('returns result of showConfirm() if instance is not in editable state',
    function () {
      spyOn(viewModel, 'isInEditableState').and.returnValue(false);

      expect(viewModel.confirmEdit()).toBe('mock');
    });

    it('dispatches setEditMode event if instance is in editable state',
    function () {
      spyOn(viewModel, 'isInEditableState').and.returnValue(true);
      viewModel.confirmEdit();

      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'setEditMode',
        isLastOpenInline: true,
      });
    });
  });
});
