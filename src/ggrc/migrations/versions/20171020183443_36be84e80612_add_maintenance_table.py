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
revision = '36be84e80612'
down_revision = '2ad7783c176'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  op.create_table(
      'maintenance',
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('under_maintenance', sa.Boolean(), nullable=False),
      sa.PrimaryKeyConstraint('id')
  )
  op.create_table(
      'migration_log',
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('down_version_num', sa.String(length=50), nullable=True),
      sa.Column('version_num', sa.String(length=50), nullable=True),
      sa.Column('is_migration_complete', sa.Boolean(), nullable=False),
      sa.Column('log', sa.String(length=250), nullable=True),
      sa.PrimaryKeyConstraint('id')
  )
  op.create_table(
      'revision_refresh_log',
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('run_revision_refresh', sa.Boolean(), nullable=False),
      sa.Column('is_revision_refresh_complete', sa.Boolean(), nullable=False),
      sa.Column('log', sa.String(length=250), nullable=True),
      sa.PrimaryKeyConstraint('id')
  )
  op.create_table(
      'reindex_log',
      sa.Column('id', sa.Integer(), nullable=False),
      sa.Column('is_reindex_complete', sa.Boolean(), nullable=False),
      sa.Column('log', sa.String(length=250), nullable=True),
      sa.PrimaryKeyConstraint('id')
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  op.drop_table('maintenance')
  op.drop_table('migration_log')
  op.drop_table('revision_refresh_log')
  op.drop_table('reindex_log')
