"""
InVision Database Models
"""

from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db, login_manager


# ── User loader (Flask-Login) ─────────────────────────────────────────────────
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ─────────────────────────────────────────────────────────────────────────────
class User(UserMixin, db.Model):
    __tablename__ = "users"

    id         = db.Column(db.Integer,     primary_key=True)
    name       = db.Column(db.String(120), nullable=False)
    email      = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password   = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)
    is_active  = db.Column(db.Boolean,     default=True)

    # Relationships
    uploads      = db.relationship("UploadedFile", backref="owner",  lazy="dynamic", cascade="all, delete-orphan")
    saved_charts = db.relationship("SavedChart",   backref="owner",  lazy="dynamic", cascade="all, delete-orphan")
    activities   = db.relationship("ActivityLog",  backref="user",   lazy="dynamic", cascade="all, delete-orphan")

    def set_password(self, raw):
        self.password = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password, raw)

    def __repr__(self):
        return f"<User {self.email}>"


# ─────────────────────────────────────────────────────────────────────────────
class UploadedFile(db.Model):
    __tablename__ = "uploaded_files"

    id          = db.Column(db.Integer,     primary_key=True)
    user_id     = db.Column(db.Integer,     db.ForeignKey("users.id"), nullable=False)
    filename    = db.Column(db.String(256), nullable=False)
    stored_name = db.Column(db.String(256), nullable=False)   # UUID filename on disk
    file_type   = db.Column(db.String(10),  nullable=False)   # csv, xlsx, pdf …
    size_bytes  = db.Column(db.Integer,     default=0)
    row_count   = db.Column(db.Integer,     default=0)
    col_count   = db.Column(db.Integer,     default=0)
    uploaded_at = db.Column(db.DateTime,    default=datetime.utcnow)
    status      = db.Column(db.String(20),  default="done")   # done | processing | error

    charts = db.relationship("SavedChart", backref="source_file", lazy="dynamic")

    def __repr__(self):
        return f"<UploadedFile {self.filename}>"


# ─────────────────────────────────────────────────────────────────────────────
class SavedChart(db.Model):
    __tablename__ = "saved_charts"

    id          = db.Column(db.Integer,     primary_key=True)
    user_id     = db.Column(db.Integer,     db.ForeignKey("users.id"),          nullable=False)
    file_id     = db.Column(db.Integer,     db.ForeignKey("uploaded_files.id"), nullable=True)
    title       = db.Column(db.String(200), nullable=False)
    chart_type  = db.Column(db.String(30),  nullable=False)   # bar, line, pie …
    label_col   = db.Column(db.String(100), nullable=False)
    value_col   = db.Column(db.String(100), nullable=False)
    config_json = db.Column(db.Text,        default="{}")     # extra Chart.js config
    preview_img = db.Column(db.String(256), nullable=True)    # path to PNG thumbnail
    created_at  = db.Column(db.DateTime,    default=datetime.utcnow)

    def __repr__(self):
        return f"<SavedChart {self.title}>"


# ─────────────────────────────────────────────────────────────────────────────
class ContactMessage(db.Model):
    __tablename__ = "contact_messages"

    id         = db.Column(db.Integer,     primary_key=True)
    name       = db.Column(db.String(120), nullable=False)
    email      = db.Column(db.String(150), nullable=False)
    subject    = db.Column(db.String(250), nullable=False)
    message    = db.Column(db.Text,        nullable=False)
    sent_at    = db.Column(db.DateTime,    default=datetime.utcnow)
    is_read    = db.Column(db.Boolean,     default=False)


# ─────────────────────────────────────────────────────────────────────────────
class ActivityLog(db.Model):
    __tablename__ = "activity_logs"

    id          = db.Column(db.Integer,     primary_key=True)
    user_id     = db.Column(db.Integer,     db.ForeignKey("users.id"), nullable=False)
    action      = db.Column(db.String(200), nullable=False)
    entity_type = db.Column(db.String(50),  nullable=True)    # file | chart | report
    entity_id   = db.Column(db.Integer,     nullable=True)
    created_at  = db.Column(db.DateTime,    default=datetime.utcnow)

    def __repr__(self):
        return f"<ActivityLog {self.action}>"
