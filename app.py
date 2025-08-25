from flask import Flask, render_template, request, redirect, url_for
import pandas as pd
import matplotlib.pyplot as plt
import os

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/visualize")
def visualize():
    return render_template("visualize.html")


@app.route("/upload", methods=["GET", "POST"])
def upload():
    if request.method == "POST":
        file = request.files["file"]
        if file:
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
            file.save(filepath)
            df = pd.read_csv(filepath)  # read file
            # Save df to session or DB later
            return redirect(url_for("dashboard"))
    return render_template("upload.html")

@app.route("/dashboard")
def dashboard():
    # Example graph
    df = pd.DataFrame({"Category": ["A", "B", "C"], "Values": [10, 20, 15]})
    plt.bar(df["Category"], df["Values"])
    graph_path = os.path.join("static", "images", "graph.png")
    plt.savefig(graph_path)
    plt.close()
    return render_template("dashboard.html", graph=graph_path)

@app.route("/insights")
def insights():
    return render_template("insights.html")

if __name__ == "__main__":
    app.run(debug=True)
