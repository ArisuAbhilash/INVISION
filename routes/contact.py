"""
Contact blueprint
"""

from flask import Blueprint, render_template, request, jsonify, current_app
from flask_mail import Message
from extensions import db, mail
from models import ContactMessage

contact_bp = Blueprint("contact", __name__)


@contact_bp.route("/")
def index():
    return render_template(
        "contact.html",
        phone_no=current_app.config["CONTACT_PHONE"],
        email_id=current_app.config["CONTACT_EMAIL"],
    )


@contact_bp.route("/send", methods=["POST"])
def send():
    data    = request.get_json(silent=True) or request.form
    name    = (data.get("name")    or "").strip()
    email   = (data.get("email")   or "").strip()
    subject = (data.get("subject") or "").strip()
    message = (data.get("message") or "").strip()

    # Basic server-side validation
    if not all([name, email, subject, message]):
        return jsonify({"error": "All fields are required."}), 422
    if "@" not in email:
        return jsonify({"error": "Invalid email address."}), 422
    if len(message) < 10:
        return jsonify({"error": "Message is too short."}), 422

    # Persist to DB
    msg_record = ContactMessage(
        name=name, email=email, subject=subject, message=message
    )
    db.session.add(msg_record)
    db.session.commit()

    # Send email notification (non-fatal if mail not configured)
    try:
        msg = Message(
            subject=f"[InVision Contact] {subject}",
            recipients=[current_app.config["CONTACT_EMAIL"]],
            body=f"From: {name} <{email}>\n\n{message}",
        )
        mail.send(msg)
    except Exception:
        pass  # Email failure doesn't break the form submit

    return jsonify({"success": True, "message": "Message sent! We'll reply within 24 hours."})
