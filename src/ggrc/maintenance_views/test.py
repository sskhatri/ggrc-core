from ggrc.maintenance import app
from ggrc import migrate
import sys
import os

@app.route('/maintenance/test')
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
  migrate.downgradeall()
  return "HEHE migration successful"