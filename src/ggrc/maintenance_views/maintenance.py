# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""View functions for maintenance"""

# pylint: disable=invalid-name
# pylint: disable=no-else-return

import re

from logging import getLogger
from ggrc.maintenance import maintenance_app
from ggrc import db
from ggrc import migrate
from ggrc import settings
from ggrc.models.maintenance import Maintenance
from ggrc.models.maintenance import MigrationLog
from ggrc.models.maintenance import ReindexLog
from ggrc.models.maintenance import RevisionRefreshLog

from google.appengine.api import users
from google.appengine.ext import deferred

from flask import json
from flask import redirect
from flask import render_template
from flask import request
from flask import session
from flask import url_for
import sqlalchemy

logger = getLogger(__name__)


def update_context(model_type, model_field, model_status, context):
  """Updates the current status for the operation."""
  try:
    row = db.session.query(model_type).order_by(
        model_type.id.desc()).first()

    if not row:
      return

    if row.log:
      context[model_status] = 'Error'

    elif getattr(row, model_field):
      context[model_status] = 'Complete'

    else:
      context[model_status] = 'In progress'

  except sqlalchemy.exc.ProgrammingError as e:
    if not re.search(r"""\(1146, "Table '.+' doesn't exist"\)$""",
                     e.message):
      raise


@maintenance_app.route('/maintenance/index')
def index():
  """Renders admin maintenance dashboard."""
  gae_user = users.get_current_user()
  if not (gae_user and gae_user.email() in settings.BOOTSTRAP_ADMIN_USERS):
    return "Unauthorized", 403
  context = {'migration_status': 'Not started',
             'reindex_status': 'Not started',
             'revision_refresh_status': 'Not started'}
  if session.get('migration_started'):
    update_context(MigrationLog,
                   'is_migration_complete',
                   'migration_status',
                   context)
  if session.get('reindex_started'):
    update_context(ReindexLog,
                   'is_reindex_complete',
                   'reindex_status',
                   context)
  if session.get('revision_refresh_started'):
    update_context(RevisionRefreshLog,
                   'is_revision_refresh_complete',
                   'revision_refresh_status',
                   context)

  return render_template("maintenance/trigger.html", **context)


def trigger_migration():
  """Triggers a deferred task for migration."""
  try:
    sess = db.session
    maint_row = sess.query(Maintenance).get(1)
    if maint_row and maint_row.under_maintenance:
      logger.info(
          'System is under maintenance. Try running migration later.')
      return
    mig_row = MigrationLog(is_migration_complete=False)
    sess.add(mig_row)

    # Set the db flag before running migrations
    if maint_row:
      maint_row.under_maintenance = True
    else:
      maint_row = Maintenance(under_maintenance=True)
      sess.add(maint_row)
    sess.commit()
  except sqlalchemy.exc.ProgrammingError as e:
    if re.search(r"""\(1146, "Table '.+' doesn't exist"\)$""", e.message):
      mig_row = None
    else:
      raise

  mig_row_id = mig_row.id if mig_row else 0
  deferred.defer(migrate.migrate, row_id=mig_row_id, _queue='ggrc')
  session['migration_started'] = True
  return mig_row_id


@maintenance_app.route('/maintenance/migrate', methods=['POST'])
def run_migration():
  """Allow authenticated user or with valid access token to run migration."""
  if "access_token" not in request.form:
    gae_user = users.get_current_user()
    if not (gae_user and gae_user.email() in settings.BOOTSTRAP_ADMIN_USERS):
      return "Unauthorized", 403

    trigger_migration()
    return redirect(url_for('index'))

  if not (hasattr(settings, 'ACCESS_TOKEN') and
          request.form.get("access_token") == settings.ACCESS_TOKEN):
    logger.error("Invalid access token: %s", request.form.get("access_token"))
    return json.dumps({"message": "Unauthorized"}), 403

  mig_row_id = trigger_migration()
  data = {'migration_task_id': mig_row_id,
          'message': 'Migration is running in background'}
  return json.dumps(data), 202


def _turn_off_maintenance_mode():
  """Turn off maintenance mode."""
  sess = db.session
  db_row = sess.query(Maintenance).get(1)
  if db_row:
    db_row.under_maintenance = False
    sess.add(db_row)
    sess.commit()
    return "Maintenance mode turned off successfully"


@maintenance_app.route('/maintenance/turnoff_maintenance_mode',
                       methods=['POST'])
def turn_off_maintenance_mode():
  """Allow authenticated user to turn off maintenance mode."""
  if "access_token" not in request.form:
    gae_user = users.get_current_user()
    if not (gae_user and
            gae_user.email() in settings.BOOTSTRAP_ADMIN_USERS):
      return "Unauthorized", 403

    return _turn_off_maintenance_mode() or ""

  if not (hasattr(settings, 'ACCESS_TOKEN') and
          request.form.get("access_token") == settings.ACCESS_TOKEN):
    logger.error("Invalid access token: %s", request.form.get("access_token"))
    return "Unauthorized", 403

  return _turn_off_maintenance_mode(), 202


@maintenance_app.route('/maintenance/check_migration_status/<row_id>',
                       methods=['GET'])
def check_migration_status(row_id):
  """Checks and returns the status of migration."""
  try:
    sess = db.session
    maint_row = sess.query(Maintenance).get(1)
    mig_row = sess.query(MigrationLog).get(row_id)
    if not (mig_row and maint_row):
      data = {"status": "Fail",
              "message": "No migration entry in db."}
      return json.dumps(data), 202

    if mig_row.log:
      data = {"status": "Fail",
              "message": "Migration failed : {}".format(mig_row.log)}
      return json.dumps(data), 202

    if not mig_row.is_migration_complete:
      return json.dumps({"status": "In progress"}), 202

    return json.dumps({"status": "Complete"}), 202

  except sqlalchemy.exc.ProgrammingError as e:
    logger.error(e.message)
    if not re.search(r"""\(1146, "Table '.+' doesn't exist"\)$""", e.message):
      raise
