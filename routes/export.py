"""
Export blueprint — CSV, Excel, JSON, PDF downloads
"""

import os
import io
import uuid
import json

import pandas as pd
from flask import (
    Blueprint, render_template, request, jsonify,
    send_file, current_app, flash
)
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from extensions import db
from models import UploadedFile, ActivityLog

export_bp = Blueprint("export", __name__)


def _load_dataframe(file_id=None, upload=None):
    """Load a DataFrame from a saved UploadedFile record or a freshly-uploaded file."""
    if file_id:
        record = UploadedFile.query.filter_by(
            id=file_id, user_id=current_user.id
        ).first_or_404()
        path = os.path.join(current_app.config["UPLOAD_FOLDER"], record.stored_name)
        ext  = record.file_type
    elif upload:
        ext  = upload.filename.rsplit(".", 1)[-1].lower()
        stored = f"{uuid.uuid4().hex}.{ext}"
        path = os.path.join(current_app.config["UPLOAD_FOLDER"], stored)
        os.makedirs(current_app.config["UPLOAD_FOLDER"], exist_ok=True)
        upload.save(path)
    else:
        return None, None, None

    df = pd.read_csv(path) if ext in ("csv",) else pd.read_excel(path)
    return df, path, ext


# ── Main page ─────────────────────────────────────────────────────────────────
@export_bp.route("/")
@login_required
def index():
    files = current_user.uploads.order_by(
        UploadedFile.uploaded_at.desc()
    ).filter(UploadedFile.file_type.in_(["csv", "xlsx", "xls"])).all()
    return render_template("export.html", files=files)


# ── Export CSV ────────────────────────────────────────────────────────────────
@export_bp.route("/csv", methods=["POST"])
@login_required
def export_csv():
    file_id = request.form.get("file_id", type=int)
    upload  = request.files.get("file")
    df, _, _ = _load_dataframe(file_id=file_id, upload=upload)
    if df is None:
        return jsonify({"error": "No data"}), 400

    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    db.session.add(ActivityLog(user_id=current_user.id, action="Exported data as CSV"))
    db.session.commit()
    return send_file(
        io.BytesIO(buf.getvalue().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name="invision_export.csv",
    )


# ── Export Excel ──────────────────────────────────────────────────────────────
@export_bp.route("/excel", methods=["POST"])
@login_required
def export_excel():
    file_id = request.form.get("file_id", type=int)
    upload  = request.files.get("file")
    df, _, _ = _load_dataframe(file_id=file_id, upload=upload)
    if df is None:
        return jsonify({"error": "No data"}), 400

    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="InVision Export")
    buf.seek(0)
    db.session.add(ActivityLog(user_id=current_user.id, action="Exported data as Excel"))
    db.session.commit()
    return send_file(
        buf,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="invision_export.xlsx",
    )


# ── Export JSON ───────────────────────────────────────────────────────────────
@export_bp.route("/json", methods=["POST"])
@login_required
def export_json():
    file_id = request.form.get("file_id", type=int)
    upload  = request.files.get("file")
    df, _, _ = _load_dataframe(file_id=file_id, upload=upload)
    if df is None:
        return jsonify({"error": "No data"}), 400

    records = df.to_dict(orient="records")
    payload = json.dumps(records, indent=2, default=str)
    db.session.add(ActivityLog(user_id=current_user.id, action="Exported data as JSON"))
    db.session.commit()
    return send_file(
        io.BytesIO(payload.encode()),
        mimetype="application/json",
        as_attachment=True,
        download_name="invision_export.json",
    )


# ── Export PDF report ─────────────────────────────────────────────────────────
@export_bp.route("/pdf", methods=["POST"])
@login_required
def export_pdf():
    """
    Minimal PDF summary using reportlab (optional dependency).
    Returns JSON stub if reportlab is not installed.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib import colors as rl_colors

        file_id = request.form.get("file_id", type=int)
        upload  = request.files.get("file")
        df, _, _ = _load_dataframe(file_id=file_id, upload=upload)
        if df is None:
            return jsonify({"error": "No data"}), 400

        buf    = io.BytesIO()
        doc    = SimpleDocTemplate(buf, pagesize=A4)
        styles = getSampleStyleSheet()
        elems  = []

        elems.append(Paragraph("InVision — Data Export Report", styles["Title"]))
        elems.append(Spacer(1, 12))
        elems.append(Paragraph(f"Rows: {len(df)} | Columns: {len(df.columns)}", styles["Normal"]))
        elems.append(Spacer(1, 12))

        # Table (first 20 rows)
        table_data = [df.columns.tolist()] + df.head(20).values.tolist()
        t = Table(table_data)
        t.setStyle(TableStyle([
            ("BACKGROUND",  (0,0), (-1,0), rl_colors.HexColor("#6c63ff")),
            ("TEXTCOLOR",   (0,0), (-1,0), rl_colors.white),
            ("FONTSIZE",    (0,0), (-1,-1), 8),
            ("GRID",        (0,0), (-1,-1), 0.25, rl_colors.grey),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [rl_colors.white, rl_colors.HexColor("#f5f5fa")]),
        ]))
        elems.append(t)
        doc.build(elems)
        buf.seek(0)

        db.session.add(ActivityLog(user_id=current_user.id, action="Generated PDF report"))
        db.session.commit()
        return send_file(buf, mimetype="application/pdf", as_attachment=True, download_name="invision_report.pdf")

    except ImportError:
        return jsonify({"error": "PDF export requires reportlab. Run: pip install reportlab"}), 501
