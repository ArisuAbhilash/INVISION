"""
InVision - Data Intelligence Platform
Flask Backend Entry Point
"""
from dotenv import load_dotenv
load_dotenv()
from flask import Flask
from extensions import db, login_manager, mail
from config import Config

# ── Blueprint imports ──────────────────────────────────────────────────────────
from routes.auth      import auth_bp
from routes.dashboard import dashboard_bp
from routes.visualize import visualize_bp
from routes.report    import report_bp
from routes.export    import export_bp
from routes.contact   import contact_bp
from routes.home      import home_bp


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ── Init extensions ────────────────────────────────────────────────────────
    db.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)

    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "info"

    # ── Register blueprints ────────────────────────────────────────────────────
    app.register_blueprint(home_bp)
    app.register_blueprint(auth_bp,      url_prefix="/auth")
    app.register_blueprint(dashboard_bp, url_prefix="/dashboard")
    app.register_blueprint(visualize_bp, url_prefix="/visualize")
    app.register_blueprint(report_bp,    url_prefix="/report")
    app.register_blueprint(export_bp,    url_prefix="/export")
    app.register_blueprint(contact_bp,   url_prefix="/contact")

    # ── Create DB tables ───────────────────────────────────────────────────────
    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
