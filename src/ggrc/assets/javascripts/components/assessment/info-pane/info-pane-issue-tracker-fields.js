/*
 Copyright (C) 2017 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../../assessment/info-pane/confirm-edit-action';
import template from './templates/info-pane-issue-tracker-fields.mustache';

const tag = 'info-pane-issue-tracker-fields';

export default GGRC.Components('infoPaneIssueTrackerFields', {
  tag: tag,
  template: template,
  viewModle: {
    instance: {},
  },
});
