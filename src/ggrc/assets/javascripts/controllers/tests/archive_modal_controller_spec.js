/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Ctrl from '../archive_modal_controller';

describe('ToggleArchive modal', function () {
  'use strict';

  describe('click() event', function () {
    var displayName = 'DISPLAY NAME';
    var event;
    var eventObj;
    var $element;
    var instance;
    var ctrlInst;
    var pendingRefresh;
    var pendingSave;

    beforeEach(function () {
      pendingRefresh = new can.Deferred();
      pendingSave = new can.Deferred();

      $element = $('<div data-modal_form="">' +
        '<a data-dismiss="modal"></a>' +
        '</div>');
      instance = new can.Map({
        save: jasmine.createSpy('save')
          .and.returnValue(pendingSave.promise()),
        setup_custom_attributes: jasmine.createSpy(),
        refresh: jasmine.createSpy('save')
          .and.returnValue(pendingRefresh.promise()),
        display_name: function () {
          return displayName;
        }
      });

      ctrlInst = {
        bindXHRToButton: jasmine.createSpy('bindXHRToButton'),
        element: $element,
        options: {
          instance: instance
        }
      };
      spyOn($.fn, 'trigger').and.callThrough();
      event = Ctrl.prototype['a.btn[data-toggle=archive]:not(:disabled) click']
        .bind(ctrlInst);
      eventObj = $.Event();
    });

    it('was notified when was archived successfully', function () {
      var successMessage = displayName + ' archived successfully';
      event($element, eventObj);
      pendingRefresh.resolve();
      pendingSave.resolve();

      expect(instance.attr('archived')).toBeTruthy();
      expect(instance.refresh).toHaveBeenCalled();
      expect(instance.save).toHaveBeenCalled();
      expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash',
        {success: [successMessage]});
    });

    it('was notified when was not archived successfully', function () {
      var errorMessage = 'Internal error';
      event($element, eventObj);
      pendingRefresh.resolve();
      pendingSave.reject({responseText: errorMessage});

      expect(instance.refresh).toHaveBeenCalled();
      expect(instance.save).toHaveBeenCalled();
      expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash',
        {error: [errorMessage]});
    });

    it('was notified when was not refreshed successfully', function () {
      var errorMessage = 'Internal error';
      event($element, eventObj);
      pendingRefresh.reject({responseText: errorMessage});

      expect(instance.refresh).toHaveBeenCalled();
      expect(instance.save).not.toHaveBeenCalled();
      expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash',
        {error: [errorMessage]});
    });
  });
});
