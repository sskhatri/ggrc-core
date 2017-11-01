# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
broken migration

Create Date: 2017-11-01 17:35:11.121736
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = 'dd499f2263'
down_revision = '356f329cda52'


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  a = b

def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""