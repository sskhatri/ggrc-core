# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Suggest persons by prefix"""

import json

from flask import current_app
from flask import request

from ggrc.integrations import client
from ggrc import settings


def suggest():
  """Suggest persons by prefix"""
  if not settings.INTEGRATION_SERVICE_URL:
    return make_suggest_result([])

  prefix = request.args.get("prefix", "").strip()
  person_client = client.PersonClient()
  entries = person_client.suggest_persons(prefix)
  return make_suggest_result(entries)


def make_suggest_result(entries):
  """Build suggest response"""
  domain = getattr(settings, "AUTHORIZED_DOMAIN", "")
  return current_app.make_response((
      json.dumps([{
          "name": "%s %s" % (entry["firstName"], entry["lastName"]),
          "email": "%s@%s" % (entry["username"], domain),
      } for entry in entries]),
      200,
      [('Content-Type', 'application/json')],
  ))
