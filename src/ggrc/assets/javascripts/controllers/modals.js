/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import './modals_controller';
import './archive_modal_controller';
import './help_controller';
import './delete_modal_controller';
import './unmap_modal_controller';
import './quick_form_controller';

if (IS_GDRIVE_ENABLED) {
  require('../../../../ggrc_gdrive_integration/assets/javascripts/controllers/gapi-modal');
}

if (IS_WORKFLOWS_ENABLED) {
  require('../../../../ggrc_workflows/assets/javascripts/controllers/approval-workflow-modal');
}
