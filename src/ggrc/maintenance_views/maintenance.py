from ggrc.maintenance import app
#from ggrc import db
#from ggrc import migrate
import sys
import os
#from google.appengine.ext import deferred
from logging import getLogger
#from ggrc.models.maintenance import Maintenance
from flask import request
from flask import render_template

logger = getLogger(__name__)

@app.route('/maintenance/index', methods=['GET', 'POST'])
def index():
  #logging.info('HEHE DEV_PREFIX : {}'.format(os.environ['DEV_PREFIX']))
  # dev_prefix = os.environ['DEV_PREFIX']
  # old_module_paths = [
  #   dev_prefix + '/opt/google-cloud-sdk/platform/google_appengine/lib/google-api-python-client',
  #   dev_prefix + '/opt/google-cloud-sdk/platform/google_appengine/lib/python-gflags',
  #   dev_prefix + '/opt/google-cloud-sdk/platform/google_appengine/lib/httplib2',
  # ]
  # for old_path in old_module_paths:
  #   sys.path.insert(0, old_path)
  #migrate.upgradeall()
  logger.info('Inside maintenance/index')
  return 'Testing...'