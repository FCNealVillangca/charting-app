"""add is_incomplete to drawings

Revision ID: 7a2b1c8d9e20
Revises: 3b5e1b4ad1a0
Create Date: 2025-11-02 00:15:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a2b1c8d9e20'
down_revision: Union[str, None] = '3b5e1b4ad1a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('drawings', sa.Column('is_incomplete', sa.Boolean(), nullable=False, server_default=sa.false()))
    # Drop server_default after backfilling default
    with op.batch_alter_table('drawings') as batch_op:
        batch_op.alter_column('is_incomplete', server_default=None)


def downgrade() -> None:
    op.drop_column('drawings', 'is_incomplete')


