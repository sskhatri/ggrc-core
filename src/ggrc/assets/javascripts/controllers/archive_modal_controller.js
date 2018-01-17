/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import ModalsController from './modals_controller';

export default ModalsController({
  pluginName: 'ggrc_controllers_toggle_archive',
  defaults: {
    skip_refresh: false,
  },
}, {
  init: function () {
    this._super();
  },
  'a.btn[data-toggle=archive]:not(:disabled) click': function (el, ev) {
    // Disable the cancel button.
    var cancelButton = this.element.find('a.btn[data-dismiss=modal]');
    var modalBackdrop = this.element.data('modal_form').$backdrop;

    this.bindXHRToButton(this.options.instance.refresh()
      .then(function () {
        var instance = this.options.instance;
        instance.attr('archived', true);

        // Need to be fixed via new API:
        // saving with filled custom_attributes
        // will cause 403 error
        instance.removeAttr('custom_attributes');
        return this.options.instance.save();
      }.bind(this))
      .then(function () {
        var instance = this.options.instance;
        var msg;

        instance.setup_custom_attributes();

        msg = instance.display_name() + ' archived successfully';
        $(document.body).trigger('ajax:flash', {success: msg});
        if (this.element) {
          this.element.trigger('modal:success', instance);
        }

        return new $.Deferred();
      }.bind(this))
      .fail(function (xhr, status) {
        $(document.body).trigger('ajax:flash', {error: xhr.responseText});
      }), el.add(cancelButton).add(modalBackdrop));
  },
});
