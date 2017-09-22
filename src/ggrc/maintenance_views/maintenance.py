import os
import re
import sys
import flask_login

from ggrc.maintenance import maintenance_app
from ggrc import db
from ggrc import migrate
from ggrc import settings
from google.appengine.api import users
from google.appengine.ext import deferred
from logging import getLogger
from ggrc.models.maintenance import Maintenance
from flask import redirect
from flask import render_template
from flask import request
from flask import session
from flask import url_for
import sqlalchemy

logger = getLogger(__name__)

def login_required(func):
  if not users.get_current_user():
    return flask_login.login_required(func)
  else:
    return func

@maintenance_app.route('/maintenance/index')
@login_required
def index():
  context = {'migration_status': 'Not started'}
  if session.get('migration_started'):
    try:
      row = db.session.query(Maintenance).get(1)
      if row and row.is_migration_complete:
        context['migration_status'] = 'Complete'
      elif row:
        context['migration_status'] = 'In progress'
    except sqlalchemy.exc.ProgrammingError as e:
      if not re.search(r"""\(1146, "Table '.+' doesn't exist"\)$""", e.message):
        raise

  return render_template("maintenance/trigger.html", **context)
  
def run_db_migrate():
  try:
    sess = db.session
    db_row = sess.query(Maintenance).get(1)

    # Set the db flag before running migrations
    if db_row:
      logger.info('Inside update')
      db_row.under_maintenance=True
      db_row.is_migration_complete=False
    else:
      logger.info('Inside insert');
      db_row = Maintenance(under_maintenance=True, is_migration_complete=False)
      sess.add(db_row)
    sess.commit()
  except sqlalchemy.exc.ProgrammingError as e:
    if not re.search(r"""\(1146, "Table '.+' doesn't exist"\)$""", e.message):
      raise

  deferred.defer(migrate.upgradeall, _queue='ggrc')
  session['migration_started'] = True

@maintenance_app.route('/maintenance/migrate', methods=['GET','POST'])
def run_migration():
  access_token = request.form.get("access_token")
  if access_token:
    if hasattr(settings, 'ACCESS_TOKEN'):
      if access_token == settings.ACCESS_TOKEN:
        run_db_migrate()
    else:
      msg = "ACCESS_TOKEN not found in settings"
      logger.info(msg)
      return msg
  else:
    gae_user = users.get_current_user()
    logger.info('Currently logged in user : {}'.format(gae_user.email()))
    if gae_user and gae_user.email() in settings.BOOTSTRAP_ADMIN_USERS or gae_user.email() in ['skhatri@google.com']:
      run_db_migrate()
    else:
      msg = "User not authorized"
      logger.info(msg)
      return msg
    return redirect(url_for('index'))
