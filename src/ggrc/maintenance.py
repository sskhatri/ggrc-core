# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Sets up Flask app."""

from collections import Iterable
from flask import render_template

from ggrc import db
import datetime
import re
from logging import getLogger
# from logging.config import dictConfig as setup_logging

from flask import Flask
# from flask.ext.sqlalchemy import get_debug_queries
# from flask.ext.sqlalchemy import SQLAlchemy
# from tabulate import tabulate
# from sqlalchemy import event

# from ggrc import db
# from ggrc import extensions
# from ggrc import notifications
from ggrc import settings


# setup_logging(settings.LOGGING)

# pylint: disable=invalid-name
logger = getLogger(__name__)

logger.info('HEHE inside maintenance.py')

app = Flask('ggrc', instance_relative_config=True)  # noqa: valid constant name
app.config.from_object(settings)
if "public_config" not in app.config:
  app.config.public_config = {}

for key in settings.exports:
  app.config.public_config[key] = app.config[key]

# Configure Flask-SQLAlchemy for app
db.app = app
db.init_app(app)


@app.before_request
def setup_maintenance_page():
  from ggrc.models.maintenance import Maintenance
  sess = db.session
  result = sess.query(Maintenance).get(1)
  logger.info('Site is down for maintenance..')
  logger.info('ID : {0}, run_db_migrate : {1},  run_revision_refresh : {2}'.format(result.id, result.run_db_migrate, result.run_revision_refresh))
  return render_template("maintenance.html")



from ggrc.maintenance_views import test