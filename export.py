from flask import Blueprint, render_template, request, send_file
import pandas as pd
from io import BytesIO
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

# Create a blueprint for export feature
export_bp = Blueprint('export', __name__, template_folder='templates')

@export_bp.route('/export', methods=['GET', 'POST'])
def export_home():
    if request.method == 'POST':
        file = request.files['file']
        if file:
            df = pd.read_csv(file)

            # Example: simple data cleaning (drop NA)
            df = df.dropna()

            # Option 1: Export CSV
            if 'export_csv' in request.form:
                buffer = BytesIO()
                df.to_csv(buffer, index=False)
                buffer.seek(0)
                return send_file(buffer, as_attachment=True, download_name="cleaned_data.csv", mimetype="text/csv")

            # Option 2: Export Excel
            if 'export_excel' in request.form:
                buffer = BytesIO()
                df.to_excel(buffer, index=False)
                buffer.seek(0)
                return send_file(buffer, as_attachment=True, download_name="cleaned_data.xlsx", mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

            # Option 3: Export PDF Report
            if 'export_pdf' in request.form:
                buffer = BytesIO()
                doc = SimpleDocTemplate(buffer)
                styles = getSampleStyleSheet()
                story = [Paragraph("Auto-Generated Report", styles['Title'])]
                story.append(Paragraph(f"Rows: {len(df)} | Columns: {len(df.columns)}", styles['Normal']))
                doc.build(story)
                buffer.seek(0)
                return send_file(buffer, as_attachment=True, download_name="report.pdf", mimetype="application/pdf")

    return render_template('export.html')
