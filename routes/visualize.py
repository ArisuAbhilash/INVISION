"""
Visualize blueprint — CSV/Excel upload + data API
"""

import os
import uuid
import json

import pandas as pd
from flask import (
    Blueprint, render_template, request, jsonify,
    current_app, flash, redirect, url_for
)
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from extensions import db
from models import UploadedFile, SavedChart, ActivityLog

visualize_bp = Blueprint("visualize", __name__)


def _allowed(filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in {"csv", "xlsx", "xls"}


# ── Main page ─────────────────────────────────────────────────────────────────
@visualize_bp.route("/")
@login_required
def index():
    recent = current_user.uploads.order_by(
        UploadedFile.uploaded_at.desc()
    ).filter(UploadedFile.file_type.in_(["csv", "xlsx", "xls"])).limit(5).all()
    return render_template("visualize.html", recent_files=recent)


# ── Upload endpoint ───────────────────────────────────────────────────────────
@visualize_bp.route("/upload", methods=["POST"])
@login_required
def upload():
    file = request.files.get("file")
    if not file or file.filename == "":
        return jsonify({"error": "No file provided"}), 400
    if not _allowed(file.filename):
        return jsonify({"error": "Unsupported file type"}), 400

    original  = secure_filename(file.filename)
    ext       = original.rsplit(".", 1)[-1].lower()
    stored    = f"{uuid.uuid4().hex}.{ext}"
    dest      = os.path.join(current_app.config["UPLOAD_FOLDER"], stored)
    os.makedirs(current_app.config["UPLOAD_FOLDER"], exist_ok=True)
    file.save(dest)

    # Parse to get shape
    try:
        df = pd.read_csv(dest) if ext == "csv" else pd.read_excel(dest)
        rows, cols = df.shape
        columns = df.columns.tolist()
        # Return first 100 rows as JSON
        preview = df.head(100).to_dict(orient="records")
    except Exception as exc:
        os.remove(dest)
        return jsonify({"error": f"Could not parse file: {exc}"}), 422

    size_bytes = os.path.getsize(dest)
    record = UploadedFile(
        user_id=current_user.id, filename=original, stored_name=stored,
        file_type=ext, size_bytes=size_bytes, row_count=rows, col_count=cols,
        status="done"
    )
    db.session.add(record)
    db.session.add(ActivityLog(
        user_id=current_user.id,
        action=f"Uploaded {original} ({rows} rows)",
        entity_type="file"
    ))
    db.session.commit()

    return jsonify({
        "file_id": record.id,
        "filename": original,
        "rows": rows,
        "cols": cols,
        "columns": columns,
        "preview": preview,
        "size_kb": round(size_bytes / 1024, 1),
    })


# ── Save chart ────────────────────────────────────────────────────────────────
@visualize_bp.route("/save-chart", methods=["POST"])
@login_required
def save_chart():
    data = request.get_json(silent=True) or {}
    chart = SavedChart(
        user_id=current_user.id,
        file_id=data.get("file_id"),
        title=data.get("title", "Untitled Chart"),
        chart_type=data.get("chart_type", "bar"),
        label_col=data.get("label_col", ""),
        value_col=data.get("value_col", ""),
        config_json=json.dumps(data.get("config", {})),
        preview_img=data.get("preview_img"),
    )
    db.session.add(chart)
    db.session.add(ActivityLog(
        user_id=current_user.id,
        action=f"Saved chart: {chart.title}",
        entity_type="chart"
    ))
    db.session.commit()
    return jsonify({"success": True, "chart_id": chart.id})


# ── Delete file ───────────────────────────────────────────────────────────────
@visualize_bp.route("/delete/<int:file_id>", methods=["DELETE"])
@login_required
def delete_file(file_id):
    record = UploadedFile.query.filter_by(id=file_id, user_id=current_user.id).first_or_404()
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], record.stored_name)
    if os.path.exists(path):
        os.remove(path)
    db.session.delete(record)
    db.session.commit()
    return jsonify({"success": True})
