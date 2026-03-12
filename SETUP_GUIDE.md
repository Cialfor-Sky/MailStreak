# MailStreak Setup Guide (Git Bash on Windows)

This guide will help you set up and run the MailStreak application on your Windows machine using **Git Bash**.

## Prerequisites

- **Python 3.10+** (Ensure it is added to PATH. Check with `python --version`)
- **Node.js 18+** & **npm** (Check with `node -v` and `npm -v`)

---

## 1. Backend Setup

Open a **new Git Bash terminal** and navigate to the `backend_py` folder:

```bash
cd backend_py
```

### Create Virtual Environment

Create a virtual environment to isolate dependencies:

```bash
python -m venv .venv
```

### Activate Virtual Environment

Activate the environment:

```bash
source .venv/Scripts/activate
```

_(You will see `(.venv)` in your terminal prompt)_

### Install Requirements

Install the necessary Python packages:

```bash
pip install -r requirements.txt
```

### Run Backend Server

Start the backend server using Uvicorn:

```bash
uvicorn app.main:app --reload --host 0.0.0.0
```

The backend will be running at [http://127.0.0.1:8000](http://127.0.0.1:8000).
Keep this terminal open!

---

## 2. Frontend Setup

Open a **second new Git Bash terminal** and navigate to the `frontend` folder:

```bash
cd frontend
```

### Install Dependencies

Install the required Node packages:

```bash
npm install
```

### Run Frontend Application

Start the development server:

```bash
npm run start
```

The frontend will launch (usually at [http://localhost:4028](http://localhost:4028)).

---

## 3. Login

- Navigate to the frontend URL in your browser.
- Use the **Super Admin** credentials:
  - **Email:** `admin@mailstreak`
  - **Password:** `mailstreak`
