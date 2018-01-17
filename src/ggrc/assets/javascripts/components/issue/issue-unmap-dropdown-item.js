/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import './issue-unmap';
import template from './issue-unmap-dropdown-item.mustache';

export default GGRC.Components('issueUnmapDropdownItem', {
  tag: 'issue-unmap-dropdown-item',
  template: template,
  viewModel: {
    define: {
      issueUnmap: {
        get: function () {
          return this.attr('page_instance.type') === 'Issue' ||
            this.attr('instance.type') === 'Issue';
        },
      },
      visibleIssueUnmap: {
        get: function () {
          return this.attr('page_instance.type') !== 'Person';
        },
      },
      denyUnmap: {
        get: function () {
          return (this.attr('page_instance.type') === 'Audit'
              && !this.attr('instance.allow_unmap_from_audit'))
            || (this.attr('instance.type') === 'Audit'
              && !this.attr('page_instance.allow_unmap_from_audit'));
        },
      },
    },
    instance: {},
    page_instance: {},
    options: {},
  },
});
