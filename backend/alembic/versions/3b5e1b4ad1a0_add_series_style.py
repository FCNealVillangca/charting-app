"""add series.style JSON column

Revision ID: 3b5e1b4ad1a0
Revises: ff9c799e5206
Create Date: 2025-11-02 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3b5e1b4ad1a0'
down_revision: Union[str, None] = 'ff9c799e5206'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('series', sa.Column('style', sa.JSON(), nullable=True))
    op.add_column('series', sa.Column('name', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('series', 'name')
    op.drop_column('series', 'style')


