# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for maintenance"""

from ggrc import db
from ggrc.models.mixins import Identifiable


class Maintenance(Identifiable, db.Model):
  """Maintenance
  Model holds flags. These flags will be used on migration, reindex, revision
  refresh and computed attribute.
  """
  __tablename__ = 'maintenance'

  under_maintenance = db.Column(db.Boolean, nullable=False, default=False)
  is_migration_complete = db.Column(db.Boolean, nullable=False, default=True)
  run_revision_refresh = db.Column(db.Boolean, nullable=False, default=False)
  is_revision_refresh_complete = db.Column(
      db.Boolean, nullable=False, default=True)
  is_reindex_complete = db.Column(db.Boolean, nullable=False, default=True)
