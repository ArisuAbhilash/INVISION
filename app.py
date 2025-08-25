from flask import Flask, render_template, request
import pandas as pd
import matplotlib.pyplot as plt
import os

app = Flask(__name__)

# Ensure folder for saving graphs exists
if not os.path.exists("static/images"):
    os.makedirs("static/images")


@app.route("/")
def home():
    return render_template("base.html")


if __name__ == "__main__":
    app.run(debug=True)
