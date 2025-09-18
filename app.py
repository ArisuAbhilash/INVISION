from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import pandas as pd
import matplotlib.pyplot as plt
import os
import uuid

app = Flask(__name__)
app.secret_key = "supersecretkey"  # required for flash messages

# Ensure folder for saving graphs exists
UPLOAD_FOLDER = "static/images"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


@app.route("/")
def home():
    return render_template("home.html", title="Home")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        # Dummy authentication check
        if email == "admin@example.com" and password == "1234":
            flash("Login successful!", "success")
            return redirect(url_for("home"))
        else:
            flash("Invalid credentials. Try again.", "danger")

    return render_template("login.html", title="Login", login_page=True)


@app.route("/signup", methods=["GET", "POST"])
def signup():
    error = None
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")

        # Check password match
        if password != confirm_password:
            error = "Passwords do not match!"
        else:
            # TODO: Save user logic here
            flash("Signup successful! Please log in.", "success")
            return redirect(url_for("login"))

    return render_template("signup.html", signup_page=True, error=error)


@app.route("/contact")
def contact():
    return render_template("contact.html", title="Contact")


@app.route("/privacy")
def privacy():
    return render_template("privacy.html", title="Privacy Policy")

@app.route("/visualize", methods=["GET", "POST"])
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

        # If user hasn't chosen columns yet -> return columns list
        label_col = request.form.get("label_col")
        # IMPORTANT: use getlist to receive multiple values sent as repeated form fields
        value_cols = request.form.getlist("value_col")

        if not label_col or not value_cols:
            return jsonify({"columns": df.columns.tolist()})

        # Build response: labels + datasets array
        try:
            labels = df[label_col].astype(str).tolist()
            datasets = []
            for col in value_cols:
                if col not in df.columns:
                    return jsonify({"error": f"Column '{col}' not found in file."}), 400
                datasets.append({
                    "label": col,
                    "data": pd.Series(df[col]).fillna(0).tolist()  # fill NaN -> 0 to avoid issues
                })
        except Exception as e:
            return jsonify({"error": f"Invalid column selection or data: {e}"}), 400

        return jsonify({"labels": labels, "datasets": datasets})

    # GET -> render page
    return render_template("visualize.html", title="Visualize File")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)