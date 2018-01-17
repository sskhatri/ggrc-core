# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""GDrive module"""

import httplib2

import flask
from flask import Blueprint

from ggrc import db             # noqa
from ggrc import settings       # noqa
from ggrc.app import app        # noqa
from ggrc.models import Document
from ggrc.models import Meeting
from ggrc.services.registry import service
from ggrc_basic_permissions.contributed_roles import RoleContributions
import ggrc_gdrive_integration.models as models
from ggrc_gdrive_integration.models.object_file import Fileable
from ggrc_gdrive_integration.models.object_event import Eventable
import ggrc_gdrive_integration.views

from oauth2client import client


blueprint = Blueprint(
    'gdrive',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/ggrc_gdrive_integration',
)


Document.__bases__ = (Fileable, ) + Document.__bases__
Document.late_init_fileable()
Meeting.__bases__ = (Eventable, ) + Meeting.__bases__
Meeting.late_init_eventable()


# Initialize views
def init_extra_views(application):
  ggrc_gdrive_integration.views.init_extra_views(application)


contributed_services = [
    service('object_files', models.ObjectFile),
    service('object_events', models.ObjectEvent)
]


class GDriveRoleContributions(RoleContributions):
  contributions = {
      'Auditor': {
          'read': ['ObjectFile', 'ObjectEvent'],
      },
      'ProgramAuditEditor': {
          'read': ['ObjectFile', 'ObjectEvent'],
          'create': ['ObjectFile', 'ObjectEvent'],
          'update': ['ObjectFile', 'ObjectEvent'],
          'delete': ['ObjectFile', 'ObjectEvent'],
      },
      'ProgramAuditOwner': {
          'read': ['ObjectFile', 'ObjectEvent'],
          'create': ['ObjectFile', 'ObjectEvent'],
          'update': ['ObjectFile', 'ObjectEvent'],
          'delete': ['ObjectFile', 'ObjectEvent'],
      },
      'ProgramAuditReader': {
          'read': ['ObjectFile', 'ObjectEvent'],
          'create': ['ObjectFile', 'ObjectEvent'],
          'delete': ['ObjectFile', 'ObjectEvent'],
      },
      'ProgramOwner': {
          'read': [],
          'create': [],
          'update': [],
          'delete': [],
      },
      'Editor': {
          'read': ['ObjectFile', 'ObjectEvent'],
          'create': ['ObjectFile', 'ObjectEvent'],
          'update': ['ObjectFile', 'ObjectEvent'],
          'delete': ['ObjectFile', 'ObjectEvent'],
      },

  }


ROLE_CONTRIBUTIONS = GDriveRoleContributions()


def get_http_auth():
  """Get valid user credentials from storage and create an authorized
  http from it.

  If nothing has been stored, or if the stored credentials are invalid,
  the OAuth2 flow is completed to obtain the new credentials.

  Returns:
      http instance authorized with the credentials
  """
  credentials = client.OAuth2Credentials.from_json(
      flask.session['credentials'])
  http_auth = credentials.authorize(httplib2.Http())
  if credentials.access_token_expired:
    credentials.refresh(http_auth)
    flask.session['credentials'] = credentials.to_json()
  return http_auth


def verify_credentials():
  """Verify credentials to gdrive for the current user

  :return: None, if valid credentials are present, or redirect to authorize fn
  """
  if 'credentials' not in flask.session:
    return authorize_app()
  credentials = client.OAuth2Credentials.from_json(
      flask.session['credentials'])
  if credentials.access_token_expired:
    return authorize_app()
  return None


@app.route("/authorize")
def authorize_app():
  """Redirect to Google API auth page to authorize"""
  redirect_back = flask.request.url
  constructor_kwargs = {
      'redirect_uri': flask.url_for("authorize_app", _external=True),
      'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
      'token_uri': 'https://accounts.google.com/o/oauth2/token',
  }
  flow = client.OAuth2WebServerFlow(
      settings.GAPI_CLIENT_ID,
      settings.GAPI_CLIENT_SECRET,
      scope='https://www.googleapis.com/auth/drive',
      **constructor_kwargs)
  if 'code' not in flask.request.args:
    auth_uri = flow.step1_get_authorize_url(state=redirect_back)
    return flask.redirect(auth_uri)
  else:
    auth_code = flask.request.args.get('code')
    credentials = flow.step2_exchange(auth_code)
  # store credentials
  flask.session['credentials'] = credentials.to_json()
  return flask.redirect(flask.request.args['state'])
