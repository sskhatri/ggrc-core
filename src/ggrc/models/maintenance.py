# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

from ggrc import db
from ggrc.models.mixins import Identifiable


class Maintenance(Identifiable, db.Model):
  """Maintenance
  Model holds flags. These flags will be used on migration, reindex, revision
  refresh and computed attribute.
  """
  __tablename__ = 'maintenances'

  run_db_migrate = db.Column(db.Boolean, nullable=False, default=False)
  run_revision_refresh = db.Column(db.Boolean, nullable=False, default=False)
  run_reindex = db.Column(db.Boolean, nullable=False, default=True)
  run_computed_attribute = db.Column(db.Boolean, nullable=False, default=True)
