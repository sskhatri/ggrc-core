/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {confirm} from '../plugins/utils/modals';

(function (can, $) {
  'use strict';

  GGRC.Components('reminder', {
    tag: 'reminder',
    template: '<content/>',
    scope: {
      instance: null,
      type: '@',
      modal_title: '@',
      modal_description: '@',

      /**
       * Create reminder notifications for all assessors of an Assessment.
       *
       * @param {can.Map} scope - the component's scope
       * @param {jQuery.Object} $el - the DOM element that triggered the action
       * @param {jQuery.Event} ev - the event object
       */
      reminder: function (scope, $el, ev) {
        var instance = scope.instance;

        instance
          .refresh()
          .then(function () {
            instance.attr('reminderType', scope.type);
            return $.when(instance.save());
          })
          .then(function () {
            confirm({
              modal_title: scope.attr('modal_title'),
              modal_description: scope.attr('modal_description'),
              button_view:
                GGRC.mustache_path + '/modals/close_buttons.mustache'
            });
          });
      }
    }
  });
})(window.can, window.can.$);
