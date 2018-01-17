/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../dropdown/dropdown';
import '../numberbox/numberbox';
import template from './templates/modal-issue-tracker-fields.mustache';

const tag = 'modal-issue-tracker-fields';

export default GGRC.Components('modalIssueTrackerFields', {
  tag: tag,
  template: template,
  viewModle: {
    instance: {},
  },
});
