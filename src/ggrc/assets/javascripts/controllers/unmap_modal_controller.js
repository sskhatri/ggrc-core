/* !
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import ModalsController from './modals_controller';

export default ModalsController({
  pluginName: 'ggrc_controllers_unmap',
  defaults: {
    skip_refresh: true,
  },
}, {
  init: function () {
    this._super();
  },
  '{$footer} a.btn[data-toggle=delete] click': function (el, ev) {
    this.element.trigger('modal:success', this.options.instance);
  },
});
