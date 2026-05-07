"""initial schema

Revision ID: 001
Revises:
Create Date: 2025-05-07

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(50), nullable=False, unique=True),
        sa.Column("description", sa.Text()),
        sa.Column("permissions", sa.JSON()),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20)),
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("roles.id"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "areas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "user_areas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("area_id", sa.Integer(), sa.ForeignKey("areas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "area_id", name="uq_user_area"),
    )

    op.execute("CREATE TYPE doctorstatus AS ENUM ('pending', 'approved', 'rejected')")
    op.create_table(
        "doctors",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("speciality", sa.String(255)),
        sa.Column("phone", sa.String(20)),
        sa.Column("address", sa.Text()),
        sa.Column("area_id", sa.Integer(), sa.ForeignKey("areas.id"), nullable=False),
        sa.Column("added_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", postgresql.ENUM("pending", "approved", "rejected", name="doctorstatus", create_type=False), nullable=False, server_default="pending"),
        sa.Column("rejection_note", sa.Text()),
        sa.Column("approved_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.execute("CREATE TYPE reportstatus AS ENUM ('draft', 'submitted', 'approved', 'rejected')")
    op.create_table(
        "visit_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("representative_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("area_id", sa.Integer(), sa.ForeignKey("areas.id"), nullable=False),
        sa.Column("report_date", sa.Date(), nullable=False),
        sa.Column("status", postgresql.ENUM("draft", "submitted", "approved", "rejected", name="reportstatus", create_type=False), nullable=False, server_default="draft"),
        sa.Column("manager_note", sa.Text()),
        sa.Column("submitted_at", sa.DateTime(timezone=True)),
        sa.Column("reviewed_at", sa.DateTime(timezone=True)),
        sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "visit_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("report_id", sa.Integer(), sa.ForeignKey("visit_reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("doctor_id", sa.Integer(), sa.ForeignKey("doctors.id"), nullable=False),
        sa.Column("visited", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("note", sa.Text()),
    )

    op.create_table(
        "expense_limits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("area_id", sa.Integer(), sa.ForeignKey("areas.id"), nullable=False),
        sa.Column("representative_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("max_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("set_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("area_id", "representative_id", name="uq_expense_limit"),
    )

    op.create_table(
        "expense_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("representative_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("area_id", sa.Integer(), sa.ForeignKey("areas.id"), nullable=False),
        sa.Column("report_date", sa.Date(), nullable=False),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("status", postgresql.ENUM("draft", "submitted", "approved", "rejected", name="reportstatus", create_type=False), nullable=False, server_default="draft"),
        sa.Column("manager_note", sa.Text()),
        sa.Column("submitted_at", sa.DateTime(timezone=True)),
        sa.Column("reviewed_at", sa.DateTime(timezone=True)),
        sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "expense_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("report_id", sa.Integer(), sa.ForeignKey("expense_reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("description", sa.String(255), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(100)),
        sa.Column("entity_id", sa.Integer()),
        sa.Column("details", sa.JSON()),
        sa.Column("ip_address", sa.String(50)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("expense_items")
    op.drop_table("expense_reports")
    op.drop_table("expense_limits")
    op.drop_table("visit_items")
    op.drop_table("visit_reports")
    op.drop_table("doctors")
    op.drop_table("user_areas")
    op.drop_table("areas")
    op.drop_table("users")
    op.drop_table("roles")
    op.execute("DROP TYPE IF EXISTS reportstatus")
    op.execute("DROP TYPE IF EXISTS doctorstatus")
