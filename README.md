# InVision — Data Intelligence Platform

A fully separated, production-grade **Flask + Vanilla JS** data visualization platform.

---

## Project Structure

```
invision/
│
├── app.py                  ← Flask entry point (create_app factory)
├── config.py               ← All configuration (DB, mail, uploads, etc.)
├── extensions.py           ← Shared extensions (db, login_manager, mail)
├── models.py               ← SQLAlchemy models (User, UploadedFile, SavedChart, …)
├── requirements.txt
│
├── routes/                 ← One blueprint per page
│   ├── __init__.py
│   ├── home.py
│   ├── auth.py             ← Login / signup / logout
│   ├── dashboard.py        ← Dashboard + activity-chart API
│   ├── visualize.py        ← File upload API + save-chart API
│   ├── report.py           ← Document analysis API
│   ├── export.py           ← CSV / Excel / JSON / PDF download
│   └── contact.py          ← Contact form + email
│
├── templates/              ← Jinja2 HTML templates
│   ├── base.html           ← Shared nav, toast, loader, dark-mode toggle
│   ├── home.html
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── visualize.html
│   ├── report.html
│   ├── export.html
│   └── contact.html
│
└── static/
    ├── css/
    │   ├── base.css        ← Design tokens, shared components
    │   ├── home.css
    │   ├── auth.css
    │   ├── dashboard.css
    │   ├── visualize.css
    │   ├── report.css
    │   ├── export.css
    │   └── contact.css
    │
    ├── js/
    │   ├── base.js         ← Theme, toast, loader, drag-drop, counters
    │   ├── home.js         ← Hero chart + stat counters
    │   ├── auth.js         ← Login & signup validation
    │   ├── dashboard.js    ← Tab switching, activity chart, delete file
    │   ├── visualize.js    ← Upload → API → Chart.js render
    │   ├── report.js       ← Document analysis UI
    │   ├── export.js       ← Format selection + blob download
    │   └── contact.js      ← AJAX contact form
    │
    ├── images/             ← Place logo and static images here
    └── reports/            ← Generated PDF reports (auto-created)
```

---

## Quick Start

### 1. Clone & create virtual environment

```bash
git clone <your-repo>
cd invision
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment (optional)

Create a `.env` file or export variables:

```bash
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///invision.db     # or postgresql://...
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password
DEBUG=True
```

### 4. Run the app

```bash
python app.py
```

Open **http://localhost:5000** in your browser.

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/` | Home page |
| GET/POST | `/auth/login` | Login |
| GET/POST | `/auth/signup` | Signup |
| GET    | `/auth/logout` | Logout |
| GET    | `/dashboard/` | Dashboard (requires login) |
| GET    | `/dashboard/api/activity-chart` | JSON: last-7-day activity |
| GET    | `/visualize/` | Visualizer page |
| POST   | `/visualize/upload` | Upload CSV/Excel → JSON response |
| POST   | `/visualize/save-chart` | Save chart config to DB |
| DELETE | `/visualize/delete/<id>` | Delete uploaded file |
| GET    | `/report/` | Report analysis page |
| POST   | `/report/analyze` | Analyze document → JSON response |
| GET    | `/export/` | Export page |
| POST   | `/export/csv` | Download CSV |
| POST   | `/export/excel` | Download Excel |
| POST   | `/export/json` | Download JSON |
| POST   | `/export/pdf` | Download PDF report |
| GET    | `/contact/` | Contact page |
| POST   | `/contact/send` | Submit contact form |

---

## Features

- **Dark / Light mode** — persisted in `localStorage`, synced across all pages
- **Flask-Login** — session management, `@login_required` on all protected routes
- **SQLAlchemy** — SQLite by default, swap `DATABASE_URL` for PostgreSQL in production
- **File upload** — CSV and Excel parsed with pandas; PDF/DOCX/TXT analyzed server-side
- **Chart.js** — 6 chart types rendered client-side from the backend's JSON response
- **Export** — CSV, Excel, JSON, PDF (requires `reportlab`) via streaming `send_file`
- **Toast notifications** — success / error / info, auto-dismiss
- **Loading overlay** — shown during all async operations
- **Form validation** — both client-side (JS) and server-side (Flask)
- **Activity log** — every meaningful user action recorded to DB
- **Responsive** — mobile-first, hamburger menu, sidebar collapses on small screens

---

## Production Checklist

- [ ] Set `DEBUG=False` and a strong `SECRET_KEY`
- [ ] Switch `DATABASE_URL` to PostgreSQL
- [ ] Set `SESSION_COOKIE_SECURE=True` (requires HTTPS)
- [ ] Configure `MAIL_*` variables for contact email delivery
- [ ] Serve static files via Nginx, not Flask
- [ ] Use Gunicorn: `gunicorn -w 4 "app:create_app()"`
- [ ] Set up file storage (S3 or mounted volume) for the `uploads/` folder
