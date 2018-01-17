/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var viewModel = can.Map.extend({
    define: {
      trigger: {
        type: 'boolean',
        set: function (value) {
          if (!this.attr('activated') && value) {
            this.attr('activated', true);
          }
        },
      },
      activatedOrForceRender: {
        get: function () {
          return this.attr('forceClearContent') ? false :
            this.attr('activated');
        },
      },
    },
    /**
     * This flag shuld be switch on and back off to trigger re-render of content
     * see tab-panel.js for example.
     * @type {Boolean}
     */
    forceClearContent: false,
    activated: false,
  });

  /**
   *
   */
  GGRC.Components('lazyRender', {
    tag: 'lazy-render',
    template: '{{#if activatedOrForceRender}}<content/>{{/if}}',
    viewModel: viewModel,
  });
})(window.can, window.GGRC);
