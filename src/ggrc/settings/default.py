# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module defines application settings."""

import os
import jinja2

DEBUG = False
TESTING = False
PRODUCTION = False
GOOGLE_INTERNAL = False

# Flask-SQLAlchemy fix to be less than `wait_time` in /etc/mysql/my.cnf
SQLALCHEMY_POOL_RECYCLE = 120

# Settings in app.py
AUTOBUILD_ASSETS = False
ENABLE_JASMINE = False
DEBUG_ASSETS = False
FULLTEXT_INDEXER = None
USER_PERMISSIONS_PROVIDER = None
EXTENSIONS = []
exports = []  # pylint: disable=invalid-name

# Deployment-specific variables
COMPANY = "Company, Inc."
COMPANY_LOGO = "/static/images/ggrc-logo.svg"
COMPANY_LOGO_TEXT = "Company GRC"
COPYRIGHT = u"Confidential. Copyright \u00A9"  # \u00A9 is the (c) symbol

# Construct build number
BUILD_NUMBER = ""
try:
  import build_number
  BUILD_NUMBER = " ({0})".format(build_number.BUILD_NUMBER[:7])
except ImportError:
  pass

# NOTE: This version name is used for GAE deployments along with the current
# commit hash. The version and hash are trimmed to 30 characters (see do_deploy
# for more info) and if the version name were to exceed 30 characters, all
# deployments would go to the same GAE app version. Please take that into
# consideration when modifying this string.
VERSION = "1.0.0-Strawberry" + BUILD_NUMBER

# Migration owner
MIGRATOR = os.environ.get(
    'GGRC_MIGRATOR',
    'Default Migrator <migrator@example.com>',
)

# Google Analytics variables
GOOGLE_ANALYTICS_ID = os.environ.get('GGRC_GOOGLE_ANALYTICS_ID', '')
GOOGLE_ANALYTICS_DOMAIN = os.environ.get('GGRC_GOOGLE_ANALYTICS_DOMAIN', '')

ANALYTICS_TEMPLATE = """
<script type="text/javascript">
(function (i,s,o,g,r,a,m) {i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', '%s', 'auto');
ga('send', 'pageview');
</script>
"""

if GOOGLE_ANALYTICS_ID:
  GOOGLE_ANALYTICS_SCRIPT = ANALYTICS_TEMPLATE % GOOGLE_ANALYTICS_ID
else:
  GOOGLE_ANALYTICS_SCRIPT = ""

# Initialize from environment if present
SQLALCHEMY_DATABASE_URI = os.environ.get('GGRC_DATABASE_URI', '')
SECRET_KEY = os.environ.get('GGRC_SECRET_KEY', 'Replace-with-something-secret')

MEMCACHE_MECHANISM = True

# AppEngine Email
APPENGINE_EMAIL = os.environ.get('APPENGINE_EMAIL', '')

CALENDAR_MECHANISM = False

MAX_INSTANCES = os.environ.get('MAX_INSTANCES', '3')

exports = ['VERSION', 'MAX_INSTANCES']  # pylint: disable=invalid-name

# Users with authorized domain will automatically get Creator role.
AUTHORIZED_DOMAIN = os.environ.get('AUTHORIZED_DOMAIN', "")

ACCESS_TOKEN = os.environ.get('ACCESS_TOKEN', '')

JINJA2 = jinja2.Environment(loader=jinja2.PackageLoader('ggrc', 'templates'))
EMAIL_DIGEST = JINJA2.get_template("notifications/email_digest.html")
EMAIL_DAILY = JINJA2.get_template("notifications/view_daily_digest.html")
EMAIL_PENDING = JINJA2.get_template("notifications/view_pending_digest.html")

USE_APP_ENGINE_ASSETS_SUBDOMAIN = False

BACKGROUND_COLLECTION_POST_SLEEP = 0


LOGGING_HANDLER = {
    "class": "logging.StreamHandler",
    "stream": "ext://sys.stdout",
    "formatter": "default",
}
LOGGING_FORMATTER = {
    "format": "%(levelname)-8s %(asctime)s %(name)s %(message)s",
}
LOGGING_ROOT = "WARNING"
LOGGING_LOGGERS = {
    "ggrc": "INFO",

    "sqlalchemy": "WARNING",
    # WARNING - logs warnings and errors only
    # INFO    - logs SQL-queries
    # DEBUG   - logs SQL-queries + result sets

    "werkzeug": "INFO",
    # WARNING - logs warnings and errors only
    # INFO    - logs HTTP-queries

    # "ggrc.utils.benchmarks": "DEBUG"
    # DEBUG - logs all benchmarks
}


DEBUG_BENCHMARK = os.environ.get("GGRC_BENCHMARK")

# GGRCQ integration
GGRC_Q_INTEGRATION_URL = os.environ.get('GGRC_Q_INTEGRATION_URL', '')

# Integration service
INTEGRATION_SERVICE_URL = os.environ.get('INTEGRATION_SERVICE_URL')

# Integration service mandatory header value
URLFETCH_SERVICE_ID = os.environ.get('URLFETCH_SERVICE_ID')

# Flag defining whether integration with issue tracker is enabled or not.
ISSUE_TRACKER_ENABLED = bool(os.environ.get('ISSUE_TRACKER_ENABLED'))

# URL template for composing Issue Tracker ticker URL.
ISSUE_TRACKER_BUG_URL_TMPL = os.environ.get('ISSUE_TRACKER_BUG_URL_TMPL')

# Dashboard integration
_DEFAULT_DASHBOARD_INTEGRATION_CONFIG = {
    "ca_name_regexp": r"^Dashboard_(.*)$",
    "ca_value_regexp": r"^https?://[^\s]+$",
}

if bool(os.environ.get("DASHBOARD_INTEGRATION", "")):
  DASHBOARD_INTEGRATION = _DEFAULT_DASHBOARD_INTEGRATION_CONFIG.copy()
else:
  DASHBOARD_INTEGRATION = None

# App2app QueryAPI endpoints
ALLOWED_QUERYAPI_APP_IDS = os.environ.get(
    "ALLOWED_QUERYAPI_APP_IDS",
    "",
).split()
