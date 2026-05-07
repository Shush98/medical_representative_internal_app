"""Run with: python seed.py  (from the backend/ directory)"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Role, User, Area, UserArea
from app.services.auth_service import get_password_hash


def seed():
    db = SessionLocal()
    try:
        roles_data = [
            {"name": "representative", "description": "Field sales representative", "permissions": []},
            {"name": "manager", "description": "Regional sales manager", "permissions": []},
            {"name": "administrator", "description": "System administrator", "permissions": []},
        ]
        roles = {}
        for rd in roles_data:
            role = db.query(Role).filter(Role.name == rd["name"]).first()
            if not role:
                role = Role(**rd)
                db.add(role)
                db.flush()
                print(f"  Created role: {rd['name']}")
            roles[rd["name"]] = role
        db.commit()

        admin = db.query(User).filter(User.email == "admin@orexis.com").first()
        if not admin:
            admin = User(
                email="admin@orexis.com",
                password_hash=get_password_hash("Admin@123"),
                full_name="System Administrator",
                role_id=roles["administrator"].id,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print("  Created admin user: admin@orexis.com / Admin@123")
        else:
            print("  Admin user already exists — skipping")

        areas_data = [
            {"name": "North Zone", "description": "Northern region coverage"},
            {"name": "South Zone", "description": "Southern region coverage"},
            {"name": "East Zone", "description": "Eastern region coverage"},
            {"name": "West Zone", "description": "Western region coverage"},
        ]
        for ad in areas_data:
            if not db.query(Area).filter(Area.name == ad["name"]).first():
                db.add(Area(**ad, created_by=admin.id))
                print(f"  Created area: {ad['name']}")
        db.commit()

        print("\nSeeding complete!")
        print("Login: admin@orexis.com  |  Password: Admin@123")
    except Exception as exc:
        db.rollback()
        print(f"Seeding failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
