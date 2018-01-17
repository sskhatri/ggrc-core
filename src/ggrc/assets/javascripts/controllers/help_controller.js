/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import ModalsController from './modals_controller';

export default ModalsController({
  pluginName: 'ggrc_controllers_help',
  defaults: {
    content_view: GGRC.mustache_path + '/help/help_modal_content.mustache',
    header_view: GGRC.mustache_path + '/help/help_modal_header.mustache',
    model: CMS.Models.Help,
    edit_btn_active: false,
  },
}, {
  init: function () {
    // this.options.edit_btn_active = can.compute(this.options.edit_btn_active);
    this._super();
  },
   "{$content} input.btn[name='commit'] click": function (el, ev) {
    if (!this.options.instance.context) {
      this.options.instance.attr('context', {id: null});
    }

    this.bindXHRToButton(this.options.instance.save().done(function () {
      $(document.body).trigger('ajax:flash', {
        success: 'Help content saved successfully',
      });
    }), el);
  },
   '{$header} .help-edit click': function (el, ev) {
    var that = this;
    setTimeout(function () {
      that.options.edit_btn_active =
        that.options.$content.find('#helpedit').is('.in');
    }, 10);
  },
   find_params: function () {
    return {slug: this.options.slug};
  },
});
