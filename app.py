from flask import Flask, render_template, request, redirect, url_for, flash
import pandas as pd
import matplotlib.pyplot as plt
import os

app = Flask(__name__)
app.secret_key = "supersecretkey"  # required for flash messages

# Ensure folder for saving graphs exists
if not os.path.exists("static/images"):
    os.makedirs("static/images")


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

    return render_template("login.html", title="Login" ,login_page=True)


if __name__ == "__main__":
    app.run(debug=True)
