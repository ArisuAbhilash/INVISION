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
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file)
        elif file.filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported file type"}), 400

        # Step 1: return column names if no selection yet
        label_col = request.form.get("label_col")
        value_col = request.form.get("value_col")

        if not label_col or not value_col:
            return jsonify({"columns": df.columns.tolist()})

        # Step 2: return selected data
        try:
            labels = df[label_col].astype(str).tolist()
            values = df[value_col].tolist()
        except KeyError:
            return jsonify({"error": "Invalid column selection"}), 400

        return jsonify({"labels": labels, "values": values})

    return render_template("visualize.html", title="visualize File")



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)