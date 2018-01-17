/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {REFRESH_RELATED} from '../../events/eventTypes';
import template from './add-issue-button.mustache';
import {
  initCounts,
} from '../../plugins/utils/current-page-utils';

export default GGRC.Components('addIssueButton', {
  tag: 'add-issue-button',
  template,
  viewModel: {
    define: {
      prepareJSON: {
        get: function () {
          var instance = this.attr('relatedInstance');
          var json = {
            assessment: {
              title: instance.title,
              id: instance.id,
              type: instance.type,
              title_singular: instance.class.title_singular,
              table_singular: instance.class.table_singular,
            },
          };

          return JSON.stringify(json);
        },
      },
    },
    relatedInstance: {},
    snapshots: [],
  },
  events: {
    refreshIssueList: function (window, event, instance) {
      let model = 'Issue';

      if (instance instanceof CMS.Models.Issue) {
        let pageInstance = GGRC.page_instance();
        initCounts(
          [model],
          pageInstance.type,
          pageInstance.id
        );
      }

      this.viewModel.attr('relatedInstance').dispatch({
        ...REFRESH_RELATED,
        model,
      });
    },
    '{window} modal:added': 'refreshIssueList',
    '{window} modal:success': 'refreshIssueList',
  },
});
