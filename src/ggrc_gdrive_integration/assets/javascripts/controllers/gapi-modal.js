/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import ModalsController from '../../../../ggrc/assets/javascripts/controllers/modals_controller';

export default ModalsController({
  pluginName: 'ggrc_controllers_gapi_modal',
  defaults: {
    skip_refresh: true,
    content_view: GGRC.mustache_path + '/gdrive/auth_button.mustache'
  },
  init: function () {
    this._super.apply(this, arguments);
    this.defaults.button_view = can.view.mustache('');
  }
}, {
  init: function () {
    this._super();
    this.element.trigger('shown');
  },
  '{scopes} change': function () {
    this.element.trigger('shown');
  },
  '{$content} a.btn[data-toggle=gapi]:not(.disabled) click': function (el) {
    el.addClass('disabled');
    GGRC.Controllers.GAPI.doGAuth_step2(null, true);
    GGRC.Controllers.GAPI.oauth_dfd.always(
      $.proxy(this.element, 'modal_form', 'hide')
    );
  },
  ' hide': function () {
    if (GGRC.Controllers.GAPI.oauth_dfd.state() === 'pending') {
      GGRC.Controllers.GAPI.oauth_dfd.reject('User canceled operation');
    }
    this.element && this.element.remove();
  }
});
