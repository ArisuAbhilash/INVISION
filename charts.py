from flask import Blueprint, render_template, request, jsonify
import pandas as pd

chart_bp = Blueprint("charts", __name__)

@chart_bp.route("/visualize", methods=["GET", "POST"])
def visualize():
    if request.method == "POST":
        if "file" not in request.files:
            return jsonify({"error": "No file part in request"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Read file with pandas
        try:
            if file.filename.endswith(".csv"):
                df = pd.read_csv(file)
            elif file.filename.endswith((".xls", ".xlsx")):
                df = pd.read_excel(file)
            else:
                return jsonify({"error": "Unsupported file type"}), 400
        except Exception as e:
            return jsonify({"error": f"Failed to read file: {e}"}), 400

        # Get column selections
        label_col = request.form.get("label_col")
        value_cols = request.form.getlist("value_col")

        if not label_col or not value_cols:
            return jsonify({"columns": df.columns.tolist()})

        try:
            labels = df[label_col].astype(str).tolist()
            datasets = []
            for col in value_cols:
                if col not in df.columns:
                    return jsonify({"error": f"Column '{col}' not found in file."}), 400
                datasets.append({
                    "label": col,
                    "data": pd.Series(df[col]).fillna(0).tolist()
                })
        except Exception as e:
            return jsonify({"error": f"Invalid column selection or data: {e}"}), 400

        return jsonify({"labels": labels, "datasets": datasets})

    # GET → render page
    return render_template("visualize.html", title="Visualize File")
