# InVision  

🚀 **InVision** is a Flask-based web application for **data visualization and insights**.  
It allows users to upload CSV/Excel files, generate interactive charts, and explore statistical insights with a modern and responsive interface.  

---

## ✨ Features
- 📊 Upload **CSV/Excel files** for analysis  
- 📈 Generate multiple chart types (Bar, Line, Scatter, Pie, etc.)  
- 📑 Explore dataset **summary & insights**  
- 🔐 User authentication with **Login & Signup**  
- 🎨 Modern UI with **responsive design** (no Bootstrap dependency)  
- 🔮 Scalable structure for adding new features in the future  

---

## 🛠 Tech Stack
- **Backend**: Flask (Python)  
- **Frontend**: HTML, CSS, Jinja2 Templates  
- **Data Handling**: Pandas, Matplotlib  
- **Storage**: Local file storage for uploads and charts  

---

##  Getting Started

### 1️ Clone the Repository

    git clone https://github.com/ArisuAbhilash/invision.git
    cd invision

### 2 Create Virtual Environment

    python -m venv venv
    source venv/bin/activate   # On Mac/Linux
    venv\Scripts\activate      # On Windows

### 3 Install Dependencies
    pip install -r requirements.txt

### 4 Run the Application
    python app.py


Open in your browser:
    👉 http://127.0.0.1:5000/


### 📂 Project Structure

    invision/
    │── app.py
    │── requirements.txt
    │── templates/
    │   ├── base.html
    │   ├── visualize.html
    │   ├── insights.html
    │   ├── login.html
    │   ├── signup.html
    │── static/
    │   ├── css/
    │   │   ├── base.css
    │   │   ├── login.css
    │   │   ├── signup.css
    │   ├── images/
    │   │   ├── logo.png
    │   │   ├── background.jpg
    │── uploads/
    │── README.md
