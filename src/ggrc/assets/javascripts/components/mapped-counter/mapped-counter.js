/*!
 Copyright (C) 2017 Google Inc., authors, and contributors <see AUTHORS file>
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  buildCountParams,
  batchRequests,
} from '../../plugins/utils/query-api-utils';

(function (can, GGRC) {
  'use strict';

  var titlesMap = {
    Total: {
      title: 'Total',
      icon: 'list-alt'
    },
    CycleTaskEntry: {
      title: 'Comments',
      icon: 'comment-o'
    },
    CycleTaskGroupObjectTask: {
      title: 'Total',
      icon: 'calendar-check-o'
    }
  };

  var viewModel = can.Map.extend({
    define: {
      icon: {
        type: 'string',
        get: function () {
          var type = this.attr('type') ? this.attr('type') : 'Total';
          var icon = titlesMap[type] ? titlesMap[type].icon : type;

          return icon.toLowerCase();
        }
      },
      title: {
        type: 'string',
        get: function () {
          var title = this.attr('type') ? this.attr('type') : 'Total';

          return titlesMap[title] ? titlesMap[title].title : title;
        }
      }
    },
    instance: null,
    type: '@',
    count: 0,
    load: function () {
      var instance = this.attr('instance');
      var type = this.attr('type');
      var relevant = {
        id: instance.id,
        type: instance.type
      };
      var types = type ? [type] : GGRC.Mappings.getMappingList(instance.type);
      var countQuery = buildCountParams(types, relevant);
      var dfds = countQuery.map(batchRequests);

      return $.when.apply($, dfds).then(function () {
        var counts = Array.prototype.slice.call(arguments);

        var total = types.reduce(function (count, type, ind) {
          return count + counts[ind][type].total;
        }, 0);

        this.attr('count', total);
      }.bind(this));
    }
  });

  GGRC.Components('mappedCounter', {
    tag: 'mapped-counter',
    template: '<i class="fa fa-{{icon}}"></i> {{title}}: {{count}}',
    viewModel: viewModel,
    events: {
      inserted: function () {
        var vm = this.viewModel;
        var promise = vm.load();

        if (vm.addContent) {
          vm.addContent(promise);
        }
      }
    }
  });
})(window.can, window.GGRC);
