# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add maintenance table

Create Date: 2017-09-22 17:08:56.567214
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = '3d8df1f399a0'
down_revision = '434683ceff87'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.create_table(
      'maintenance',
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('under_maintenance', sa.Boolean(), nullable=False),
      sa.Column('is_migration_complete', sa.Boolean(), nullable=False),
      sa.Column('run_revision_refresh', sa.Boolean(), nullable=False),
      sa.Column('is_revision_refresh_complete', sa.Boolean(), nullable=False),
      sa.Column('is_reindex_complete', sa.Boolean(), nullable=False),
      sa.PrimaryKeyConstraint('id')
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_table('maintenance')
