"""
InVision Configuration
"""

import os
from datetime import timedelta
from urllib.parse import quote_plus

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    # ── Core ──────────────────────────────────────────────────────────────────
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    DEBUG      = os.environ.get("DEBUG", "True") == "True"

    # ── Database (MySQL via PyMySQL) ───────────────────────────────────────────
    # All values loaded from .env file — no hardcoded credentials
    _DB_USER     = os.environ.get("MYSQL_USER")
    _DB_PASSWORD = quote_plus(os.environ.get("MYSQL_PASSWORD", ""))
    _DB_HOST     = os.environ.get("MYSQL_HOST",     "127.0.0.1")
    _DB_PORT     = os.environ.get("MYSQL_PORT",     "3306")
    _DB_NAME     = os.environ.get("MYSQL_DATABASE", "invision_db")

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{_DB_USER}:{_DB_PASSWORD}@{_DB_HOST}:{_DB_PORT}/{_DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,          # auto-reconnect if connection drops
        "pool_recycle":  3600,          # recycle connections every 1 hour
        "pool_size":     5,
        "max_overflow":  10,
    }

    # ── File uploads ──────────────────────────────────────────────────────────
    UPLOAD_FOLDER       = os.path.join(BASE_DIR, "uploads")
    REPORTS_FOLDER      = os.path.join(BASE_DIR, "static", "reports")
    ALLOWED_EXTENSIONS  = {"csv", "xlsx", "xls", "pdf", "docx", "txt"}
    MAX_CONTENT_LENGTH  = 10 * 1024 * 1024          # 10 MB

    # ── Session ───────────────────────────────────────────────────────────────
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    SESSION_COOKIE_HTTPONLY    = True
    SESSION_COOKIE_SAMESITE    = "Lax"

    # ── Mail (Flask-Mail) ─────────────────────────────────────────────────────
    MAIL_SERVER   = os.environ.get("MAIL_SERVER",   "smtp.gmail.com")
    MAIL_PORT     = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS  = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = ("InVision", os.environ.get("MAIL_USERNAME", ""))

    # ── Contact info (rendered in templates) ──────────────────────────────────
    CONTACT_PHONE = "+91 98765 43210"
    CONTACT_EMAIL = "contact@invision.app"


class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SECURE = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"