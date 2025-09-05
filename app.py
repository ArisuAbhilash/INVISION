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





if __name__ == "__main__":
    app.run(debug=True)
