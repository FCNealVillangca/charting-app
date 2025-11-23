"""remove_is_incomplete_from_drawings

Revision ID: 225bacc8bb54
Revises: 7a2b1c8d9e20
Create Date: 2025-11-23 12:39:43.578821

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '225bacc8bb54'
down_revision: Union[str, Sequence[str], None] = '7a2b1c8d9e20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove is_incomplete column from drawings table."""
    # SQLite doesn't support DROP COLUMN directly, need batch mode
    with op.batch_alter_table('drawings') as batch_op:
        batch_op.drop_column('is_incomplete')


def downgrade() -> None:
    """Re-add is_incomplete column to drawings table."""
    op.add_column('drawings', sa.Column('is_incomplete', sa.Boolean(), nullable=False, server_default=sa.false()))
    # Drop server_default after backfilling
    with op.batch_alter_table('drawings') as batch_op:
        batch_op.alter_column('is_incomplete', server_default=None)
