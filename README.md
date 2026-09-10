# Lab Companion: Institutional Laboratory & Academic Management System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0%2B-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0%2B-646CFF.svg)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E.svg)](https://supabase.com/)
[![Security](https://img.shields.io/badge/Security-2--Step%20OTP%20%2B%20RBAC-red.svg)]()

**Lab Companion** is an enterprise-grade academic compliance and laboratory management platform engineered for engineering institutions. It provides an end-to-end administration for college laboratories, student submission grading, attendance tracking, faculty provisioning, and multi-tier access control with mandatory administrative approval.

---

## Key Features

- **Multi-Tier Role-Based Access Control (RBAC)**:
  - **Student Portal**: Lab schedule viewing, curriculum modules, experiment reports, attendance analytics, and live workbench monitoring.
  - **Teacher Portal**: Cohort batch supervision, submission verification, grading, and session attendance tracking.
  - **Administrator Portal**: Institutional statistics, faculty onboarding, and mandatory student registration approval.
- **Mandatory Admin Approval Workflow**: Newly registered students cannot access the portal until approved by the Institutional Administrator (`admin`).
- **2-Step Authentication & Email OTP**: 6-digit numeric passcodes dispatched directly via Google SMTP (with Supabase Auth fallback) with a 10-minute validity window.
- **Cloud Database Support**: Native integration with **Supabase PostgreSQL** via connection pooling, with full DDL schema and automatic seeding.
- **Modern Responsive Interface**: React 18 frontend with dark/light themes, real-time status badges, and streamlined laboratory navigation.

---

## Architecture & Project Structure

```text
Lab Companion 2/
├── .env.example              # Master environment configuration template
├── .gitignore                # Repository-level protection shielding credentials
├── README.md                 # Complete system documentation
│
├── backend/                  # Django REST Framework Backend
│   ├── api/                  # Models, Views, Serializers, Migrations, Seed Commands
│   ├── lab_backend/          # Settings, WSGI, Security Middleware, CORS
│   ├── schema.sql            # Clean PostgreSQL DDL schema export
│   ├── test_e2e.py           # Automated end-to-end security & flow verification test suite
│   ├── test_smtp.py          # SMTP diagnostic & verification utility
│   ├── test_supabase.py      # Supabase Auth diagnostic utility
│   ├── .env.example          # Backend environment template
│   ├── .gitignore            # Backend-specific ignore rules
│   └── manage.py             # Django CLI entrypoint
│
└── frontend/                 # React + Vite Frontend
    ├── public/               # Favicons and SVG icon sets
    ├── src/                  # React components, dashboards, auth forms, API services
    ├── .env.example          # Frontend API URL template
    ├── .gitignore            # Frontend-specific ignore rules
    ├── index.html            # Main HTML template
    ├── package.json          # Frontend dependencies
    └── vite.config.js        # Vite configuration
```

---

## Quick Start Guide

### 1. Backend Setup (Django REST Framework)

```powershell
# 1. Navigate to the backend folder
cd backend

# 2. Copy the environment configuration template
copy .env.example .env

# 3. Edit backend/.env with your credentials:
#    - DATABASE_URL: Your Supabase PostgreSQL pooler connection string
#    - EMAIL_HOST_USER: Your Gmail address (e.g. admin@gmail.com)
#    - EMAIL_HOST_PASSWORD: Your 16-character Google App Password

# 4. Synchronize database migrations
py manage.py migrate

# 5. Seed initial curriculum labs and administrator account
py manage.py seed_data

# 6. Start the development server
py manage.py runserver
```
The backend API will be available at `http://127.0.0.1:8000/api/`.

---

### 2. Frontend Setup (React + Vite)

```powershell
# 1. In a new terminal, navigate to the frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. (Optional) Copy frontend environment template if custom port is used
copy .env.example .env

# 4. Start the Vite development server
npm run dev
```
The frontend portal will be live at `http://localhost:5173/`.

---

## Automated Verification & Diagnostic Tools

Run automated diagnostics to ensure full operational readiness:

### 1. End-to-End System & Security Test
Runs all 6 institutional test suites (admin authorization, route protection, student OTP registration, mandatory approval gating, faculty onboarding, and grading):
```powershell
cd backend
py test_e2e.py
```

### 2. Email Delivery Verification
Verify Google SMTP delivery and send a live confirmation email:
```powershell
cd backend
py test_smtp.py your.email@example.com
```

### 3. Supabase Auth Diagnostic
Test Supabase project endpoint connectivity:
```powershell
cd backend
py test_supabase.py your.email@example.com
```

---

## GitHub Publication & Security Policy

This repository is strictly configured to ensure safe publication to GitHub:

1. **Multi-Tier `.gitignore` Protection**:
   - The root [`.gitignore`](.gitignore) blocks any `.env` or `.env.*` files from ever being staged or committed.
   - Build artifacts (`node_modules/`, `dist/`, `staticfiles/`), database caches (`*.sqlite3`), and scratch folders are blocked.
2. **Zero Hardcoded Secrets**:
   - No database passwords, Google App Passwords, API tokens, or session secrets exist in any tracked code files.
   - Real credentials exist solely in your local, uncommitted `backend/.env`.
3. **Pristine Templates**:
   - Safe, documented templates ([`.env.example`](.env.example) and [`backend/.env.example`](backend/.env.example)) provide turnkey instructions for contributors with zero secret leakage.
