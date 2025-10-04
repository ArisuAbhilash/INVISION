from flask import Flask, render_template, request, redirect, url_for, flash
from charts import chart_bp  # import blueprint
from export import export_bp

app = Flask(__name__)
app.secret_key = "supersecretkey"

# Register chart blueprint
app.register_blueprint(chart_bp)
app.register_blueprint(export_bp, url_prefix="/export")

@app.route("/")
def home():
    return render_template("home.html", title="Home")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
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
        if password != confirm_password:
            error = "Passwords do not match!"
        else:
            flash("Signup successful! Please log in.", "success")
            return redirect(url_for("login"))
    return render_template("signup.html", signup_page=True, error=error)

@app.route("/contact")
def contact():
    return render_template("contact.html", title="Contact")

@app.route("/privacy")
def privacy():
    return render_template("privacy.html", title="Privacy Policy")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
