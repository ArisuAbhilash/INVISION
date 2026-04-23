"""
Dashboard blueprint
"""

from flask import Blueprint, render_template, jsonify
from flask_login import login_required, current_user
from models import UploadedFile, SavedChart, ActivityLog

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/")
@login_required
def index():
    uploads      = current_user.uploads.order_by(UploadedFile.uploaded_at.desc()).limit(10).all()
    saved_charts = current_user.saved_charts.order_by(SavedChart.created_at.desc()).limit(12).all()
    activities   = current_user.activities.order_by(ActivityLog.created_at.desc()).limit(20).all()

    # KPI stats
    stats = {
        "total_uploads": current_user.uploads.count(),
        "total_charts":  current_user.saved_charts.count(),
        "total_reports": current_user.uploads.filter_by(file_type="pdf").count(),
    }
    return render_template(
        "dashboard.html",
        uploads=uploads,
        saved_charts=saved_charts,
        activities=activities,
        stats=stats,
    )


# ── API: activity data for chart ──────────────────────────────────────────────
@dashboard_bp.route("/api/activity-chart")
@login_required
def activity_chart():
    """Return last-7-day upload & chart counts as JSON for Chart.js."""
    from datetime import datetime, timedelta
    from extensions import db
    from sqlalchemy import func

    today = datetime.utcnow().date()
    labels, uploads, charts = [], [], []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        labels.append(day.strftime("%a"))

        u = UploadedFile.query.filter(
            UploadedFile.user_id == current_user.id,
            func.date(UploadedFile.uploaded_at) == day
        ).count()

        c = SavedChart.query.filter(
            SavedChart.user_id == current_user.id,
            func.date(SavedChart.created_at) == day
        ).count()

        uploads.append(u)
        charts.append(c)

    return jsonify({"labels": labels, "uploads": uploads, "charts": charts})
