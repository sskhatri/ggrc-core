/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getDashboards} from '../plugins/utils/dashboards-utils';

(function (can, $) {
  can.Control('GGRC.Controllers.DashboardWidget', {
    defaults: {
      model: null,
      instance: null,
      isLoading: true
    },
    init: function () {
      var that = this;
      $(function () {
        if (GGRC.page_object) {
          $.extend(that.defaults, {
            model: GGRC.infer_object_type(GGRC.page_object),
            instance: GGRC.page_instance()
          });
        }
      });
    }
  }, {
    init: function () {
      var frag;
      var dashboards =
        getDashboards(this.options.instance);

      this.options.context = new can.Map({
        model: this.options.model,
        instance: this.options.instance,
        dashboards: dashboards,
        activeDashboard: dashboards[0],
        showDashboardList: dashboards.length > 1,
        selectDashboard: function (dashboard) {
          this.attr('activeDashboard', dashboard);
        }
      });

      frag = can.view(this.options.widget_view,
                      this.options.context);
      this.element.html(frag);
      return 0;
    }
  });
})(window.can, window.can.$);
