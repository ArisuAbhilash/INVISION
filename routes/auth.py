"""
Auth blueprint — login, signup, logout
"""

from flask import Blueprint, render_template, redirect, url_for, request, flash, session
from flask_login import login_user, logout_user, login_required, current_user
from extensions import db
from models import User, ActivityLog

auth_bp = Blueprint("auth", __name__)


# ── Helpers ───────────────────────────────────────────────────────────────────
def _log(user_id, action):
    db.session.add(ActivityLog(user_id=user_id, action=action))
    db.session.commit()


# ── Login ─────────────────────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    error = None
    if request.method == "POST":
        email    = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        remember = bool(request.form.get("remember"))

        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user, remember=remember)
            session.permanent = True
            _log(user.id, "Signed in")
            flash("Welcome back!", "success")
            next_page = request.args.get("next")
            return redirect(next_page or url_for("dashboard.index"))
        else:
            error = "Invalid email or password."

    return render_template("login.html", error=error)


# ── Signup ────────────────────────────────────────────────────────────────────
@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    error = None
    if request.method == "POST":
        name     = request.form.get("name", "").strip()
        email    = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm  = request.form.get("confirm_password", "")

        if not name or not email or not password:
            error = "All fields are required."
        elif len(password) < 8:
            error = "Password must be at least 8 characters."
        elif password != confirm:
            error = "Passwords do not match."
        elif User.query.filter_by(email=email).first():
            error = "An account with that email already exists."
        else:
            user = User(name=name, email=email)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            _log(user.id, "Created account")
            login_user(user)
            flash("Account created! Welcome to InVision 🎉", "success")
            return redirect(url_for("dashboard.index"))

    return render_template("signup.html", error=error)


# ── Logout ────────────────────────────────────────────────────────────────────
@auth_bp.route("/logout")
@login_required
def logout():
    _log(current_user.id, "Signed out")
    logout_user()
    flash("You have been signed out.", "info")
    return redirect(url_for("home.index"))
