# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Sets up Flask app."""


import re

from logging import getLogger
from logging.config import dictConfig as setup_logging
import sqlalchemy

from flask import Flask
from flask import redirect
from flask import render_template
from flask import request
from flask import url_for
from flask.ext.sqlalchemy import get_debug_queries
from flask.ext.sqlalchemy import SQLAlchemy
from tabulate import tabulate

from ggrc import db
from ggrc import extensions
from ggrc import notifications
from ggrc import settings
from ggrc.utils import benchmark


setup_logging(settings.LOGGING)

# pylint: disable=invalid-name
logger = getLogger(__name__)


app = Flask('ggrc', instance_relative_config=True)  # noqa: valid constant name
app.config.from_object(settings)
if "public_config" not in app.config:
  app.config.public_config = {}

for key in settings.exports:
  app.config.public_config[key] = app.config[key]

# Configure Flask-SQLAlchemy for app
db.app = app
db.init_app(app)

# This should be imported after db.init_app id performed.
# Imported so it can be used with getattr.
from ggrc import contributions  # noqa  # pylint: disable=unused-import,wrong-import-position

# This is executed before every request
@app.before_request
def _ensure_session_teardown():
  """Ensure db.session is correctly removed

  Occasionally requests are terminated without calling the teardown methods,
  namely with DeadlineExceededError on App Engine.
  """
  if db.session.registry.has():
    db.session.remove()

# This is executed before every request
@app.before_request
def setup_user_timezone_offset():
  """Setup user timezon for current request

  It will setup from request header `X-UserTimezoneOffset`
  offset will be sent in minutes.
  """
  from flask import g
  g.user_timezone_offset = request.headers.get("X-UserTimezoneOffset")

# For every request, check if maintenance bit is set. If yes the maintenance page will be shown
@app.before_request
def check_if_under_maintenance():
  """Check if the site is in maintenance mode."""
  with benchmark('Check for maintenance'):
    from ggrc.models.maintenance import Maintenance
    sess = db.session
    try:
      db_row = sess.query(Maintenance).get(1)
    except sqlalchemy.exc.ProgrammingError as e:
      if re.search(r"""\(1146, "Table '.+' doesn't exist"\)$""", e.message):
        db_row = None
      else:
        raise
    condition = (db_row and
                 db_row.under_maintenance and
                 request.path != url_for('maintenance_') and
                 request.path != '/_ah/start')
    if condition:
      return redirect(url_for('maintenance_'))


@app.route('/maintenance_')
def maintenance_():
  """Render a maintenance page while on maintenance mode."""
  return render_template("maintenance/maintenance.html")


def setup_error_handlers(app_):
  from ggrc.utils import error_handlers
  error_handlers.register_handlers(app_)


def init_models(app_):
  import ggrc.models
  ggrc.models.init_app(app_)


def configure_flask_login(app_):
  import ggrc.login
  ggrc.login.init_app(app_)


def configure_webassets(app_):
  """Add basic webassets configuration."""
  from ggrc import assets
  app_.jinja_env.add_extension('webassets.ext.jinja2.assets')
  app_.jinja_env.assets_environment = assets.environment


def configure_jinja(app_):
  """Add basic jinja configuration."""
  app_.jinja_env.add_extension('jinja2.ext.autoescape')
  app_.jinja_env.autoescape = True
  app_.jinja_env.add_extension('jinja2.ext.with_')
  app_.jinja_env.add_extension('hamlpy.ext.HamlPyExtension')


def init_services(app_):
  import ggrc.services
  ggrc.services.init_all_services(app_)


def init_views(app_):
  import ggrc.views
  ggrc.views.init_all_views(app_)


def init_extension_blueprints(app_):
  for extension_module in extensions.get_extension_modules():
    if hasattr(extension_module, 'blueprint'):
      app_.register_blueprint(extension_module.blueprint)


def init_permissions_provider():
  from ggrc.rbac import permissions
  permissions.get_permissions_provider()


def init_extra_listeners():
  """Initializes listeners for additional services"""
  from ggrc.automapper import register_automapping_listeners
  from ggrc.snapshotter.listeners import register_snapshot_listeners
  from ggrc.fulltext import listeners
  register_automapping_listeners()
  register_snapshot_listeners()
  listeners.register_fulltext_listeners()


def _enable_debug_toolbar():
  """Enable flask debug toolbar for benchmarking requests."""
  if getattr(settings, "FLASK_DEBUGTOOLBAR", False):
    from flask_debugtoolbar import DebugToolbarExtension
    DebugToolbarExtension(app)


def _enable_jasmine():
  """Set jasmine sources and specs if it's enabled.

  Jasmine is used for javascript tests and is not installed on the production
  environment, that is why we must check if it enabled before tying to import
  it.
  """
  if getattr(settings, "ENABLE_JASMINE", False):
    from flask.ext.jasmine import Asset
    from flask.ext.jasmine import Jasmine
    # Configure Flask-Jasmine, for dev mode unit testing
    jasmine = Jasmine(app)

    jasmine.sources(
        Asset("dashboard-js-templates"))


def _display_sql_queries():
  """Set up display database queries

  This function makes sure we display the sql queries if the record setting is
  enabled.
  """
  report_type = getattr(settings, "SQLALCHEMY_RECORD_QUERIES", False)
  valid_types = ('count', 'slow', 'all')
  if report_type:
    if report_type not in valid_types:
      raise Exception("""Invalid SQLALCHEMY_RECORD_QUERIES value specified.
        Possible options: {}""".format(', '.join(valid_types)))

    # pylint: disable=unused-variable
    @app.after_request
    def display_queries(response):
      """Display database queries

      Prints out SQL queries, EXPLAINs for queries above slow_threshold, and
      a final count of queries after every HTTP request
      """
      slow_threshold = 0.5  # EXPLAIN queries that ran for more than 0.5s
      queries = get_debug_queries()
      logger.info("Total queries: %s", len(queries))
      if report_type == 'count':
        return response
      # We have to copy the queries list below otherwise queries executed
      # in the for loop will be appended causing an endless loop
      for query in queries[:]:
        if report_type == 'slow' and query.duration < slow_threshold:
          continue
        logger.info(
            "%.8f %s\n%s\n%s",
            query.duration,
            query.context,
            query.statement,
            query.parameters)
        is_select = bool(re.match('SELECT', query.statement, re.I))
        if query.duration > slow_threshold and is_select:
          try:
            statement = "EXPLAIN " + query.statement
            engine = SQLAlchemy().get_engine(app)
            result = engine.execute(statement, query.parameters)
            logger.info(tabulate(result.fetchall(), headers=result.keys()))
          except:  # pylint: disable=bare-except
            logger.warning("Statement failed: %s", statement, exc_info=True)
      return response


setup_error_handlers(app)
init_models(app)
configure_flask_login(app)
configure_webassets(app)
configure_jinja(app)
init_services(app)
init_views(app)
init_extension_blueprints(app)
init_permissions_provider()
init_extra_listeners()
notifications.register_notification_listeners()

_enable_debug_toolbar()
_enable_jasmine()
_display_sql_queries()
