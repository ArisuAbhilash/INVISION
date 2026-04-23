"""
Report blueprint — document analysis (PDF / DOCX / TXT)
"""

import os
import uuid
import re
from collections import Counter

from flask import (
    Blueprint, render_template, request, jsonify,
    current_app, send_from_directory, flash
)
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from extensions import db
from models import UploadedFile, ActivityLog

report_bp = Blueprint("report", __name__)


def _allowed(filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in {"pdf", "docx", "txt"}


def _extract_text(path, ext):
    """Return plain text from the uploaded document."""
    if ext == "txt":
        with open(path, encoding="utf-8", errors="ignore") as f:
            return f.read()

    if ext == "pdf":
        try:
            import pdfplumber
            with pdfplumber.open(path) as pdf:
                return "\n".join(p.extract_text() or "" for p in pdf.pages)
        except Exception:
            return ""

    if ext == "docx":
        try:
            from docx import Document
            doc = Document(path)
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception:
            return ""

    return ""


def _analyze(text):
    """Return a dict of analysis results."""
    words_raw  = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    stop_words = {
        "the","and","for","with","that","this","from","are","was","were",
        "has","have","had","not","but","they","their","you","can","will",
        "its","our","your","all","been","who","one","more","also","than",
        "into","any","about","when","which","some","would","there","other"
    }
    filtered   = [w for w in words_raw if w not in stop_words]
    top_words  = Counter(filtered).most_common(12)
    word_count = len(words_raw)
    sentences  = len(re.findall(r"[.!?]+", text)) or 1

    # Flesch-Kincaid estimate (simplified)
    avg_words_per_sentence = word_count / sentences
    readability = (
        "Very Easy"   if avg_words_per_sentence < 10 else
        "Easy"        if avg_words_per_sentence < 15 else
        "Standard"    if avg_words_per_sentence < 20 else
        "Difficult"   if avg_words_per_sentence < 28 else
        "Very Difficult"
    )

    # Naive sentiment
    pos_words = {"good","great","excellent","success","positive","growth","improved","strong","best","profit","gain","happy","outstanding"}
    neg_words = {"bad","poor","loss","negative","decline","failed","weak","risk","problem","issue","concern","deficit"}
    pos_count = sum(1 for w in words_raw if w in pos_words)
    neg_count = sum(1 for w in words_raw if w in neg_words)
    total_sentiment = pos_count + neg_count or 1
    polarity    = round(pos_count / total_sentiment, 2)
    subjectivity = round(min((pos_count + neg_count) / max(word_count, 1) * 20, 1.0), 2)
    sentiment_label = "Positive" if polarity > 0.6 else "Negative" if polarity < 0.4 else "Neutral"

    # Summary (first 3 sentences)
    raw_sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    summary = " ".join(raw_sentences[:3]) if raw_sentences else text[:400]

    return {
        "word_count":   word_count,
        "sentences":    sentences,
        "paragraphs":   text.count("\n\n") + 1,
        "top_words":    [{"word": w, "count": c} for w, c in top_words],
        "readability":  readability,
        "sentiment": {
            "label":       sentiment_label,
            "polarity":    polarity,
            "subjectivity": subjectivity,
        },
        "summary": summary[:600],
    }


# ── Main page ─────────────────────────────────────────────────────────────────
@report_bp.route("/")
@login_required
def index():
    return render_template("report.html")


# ── Analyze endpoint ──────────────────────────────────────────────────────────
@report_bp.route("/analyze", methods=["POST"])
@login_required
def analyze():
    file = request.files.get("document")
    if not file or file.filename == "":
        return jsonify({"error": "No file provided"}), 400
    if not _allowed(file.filename):
        return jsonify({"error": "Unsupported type. Use PDF, DOCX, or TXT"}), 400

    original = secure_filename(file.filename)
    ext      = original.rsplit(".", 1)[-1].lower()
    stored   = f"{uuid.uuid4().hex}.{ext}"
    dest     = os.path.join(current_app.config["UPLOAD_FOLDER"], stored)
    os.makedirs(current_app.config["UPLOAD_FOLDER"], exist_ok=True)
    file.save(dest)

    size_bytes = os.path.getsize(dest)
    text       = _extract_text(dest, ext)
    analysis   = _analyze(text)

    # Persist upload record
    record = UploadedFile(
        user_id=current_user.id, filename=original, stored_name=stored,
        file_type=ext, size_bytes=size_bytes, status="done"
    )
    db.session.add(record)
    db.session.add(ActivityLog(
        user_id=current_user.id,
        action=f"Analyzed document: {original}",
        entity_type="file", entity_id=None
    ))
    db.session.commit()

    metadata = {
        "Filename":     original,
        "File Type":    ext.upper(),
        "Size":         f"{round(size_bytes/1024,1)} KB",
        "Word Count":   f"{analysis['word_count']:,}",
        "Sentences":    str(analysis["sentences"]),
        "Paragraphs":   str(analysis["paragraphs"]),
        "Reading Time": f"~{max(1, analysis['word_count']//200)} min",
        "Language":     "English",
    }

    return jsonify({
        "success":  True,
        "metadata": metadata,
        "analysis": analysis,
    })
