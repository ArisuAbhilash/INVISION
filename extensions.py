"""
Shared Flask extensions — imported by app.py and routes to avoid circular imports.
"""

from flask_sqlalchemy  import SQLAlchemy
from flask_login       import LoginManager
from flask_mail        import Mail

db            = SQLAlchemy()
login_manager = LoginManager()
mail          = Mail()
