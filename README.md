# NoteShare App

A full‑stack note sharing app. Users can register, create and edit notes with file attachments, browse others’ notes, bookmark and rate notes, and view public/self profiles. An admin dashboard is included for basic user management. The UI is built with React (Vite, Tailwind) and the API with Django REST Framework + JWT.

## Features

- Authentication and profiles
  - Register, login (JWT), password reset via email
  - View/update your profile (name, email, bio)
  - Public profile pages by username/email
- Notes
  - Create, read, update, delete notes
  - File attachments (served from /media in dev)
  - Categories: Personal, Work, School
  - Bookmark notes and rate 1–5 stars (with average + count)
  - Search endpoint (title/body/category)
- Lists and UI
  - Homepage feed with category filter and search (query param `?q=`)
  - My Notes page with filters/sort/date range
  - Shimmer/skeleton loading for smooth transitions
- Admin tools
  - Admin Users list with role/active toggles and delete
  - Online presence (via heartbeat) and last login tracking

## Tech stack

- Frontend: React 19, Vite, Tailwind CSS, React Router, Axios, React Toastify
- Backend: Django 5, Django REST Framework, SimpleJWT, django‑cors‑headers
- DB: SQLite (dev default)

## Repository structure

- `backend1/`
  - `backend/` – Django project (settings, urls, wsgi)
  - `myapp/` – API app (models, serializers, views, urls)
  - `media/` – user uploads (attachments)
- `frontend1/`
  - React app (Vite) with pages, components, context, and Tailwind

## API overview

Base URL (dev): `https://noresharing-app-fullstack-2.onrender.com`

Auth and profile

- POST `/api/user/register/` – register
- POST `/api/user/login/` – login (returns access/refresh)
- POST `/api/token/refresh/` – refresh access
- GET/PATCH `/api/user/profile/` – self profile
- POST `/api/user/change-password/`
- POST `/api/user/send-reset-password-email/`
- POST `/api/user/reset-password/<uid>/<token>/`
- GET `/api/user/profile/<username>/` – public profile by email/name

Notes

- GET/POST `/api/user/notes/` – list all notes (GET is public), create (auth)
- GET `/api/user/notes/mine/` – current user’s notes (auth)
- GET `/api/user/notes/bookmarked/` – my bookmarks (auth)
- GET `/api/user/notes/by-user/<username>/` – public by username/email
- GET/PUT/DELETE `/api/user/notes/<slug>/` – detail/update/delete
- POST/DELETE `/api/user/notes/<slug>/rate/` – rate (auth)
- POST/DELETE `/api/user/notes/<slug>/bookmark/` – toggle bookmark (auth)
- GET `/api/user/search_notes/?q=...` – search (restricted to requester in code)
- GET `/api/user/download/attachment/<id>/` – download attachment

Admin

- GET `/api/user/admin/users/` – list users (auth admin). Optional `?all=1`
- PATCH/DELETE `/api/user/admin/users/<id>/` – update/delete user
- POST `/api/user/heartbeat/` – updates `last_seen` (used for “online”)

## Frontend highlights

- Global Axios instance with auto token attach + refresh on 401 (`src/utils/axiosInterceptor.js`)
- NotesContext fetches and stores the notes list for the homepage
- Pages
  - Home – category filter, counts badge, shimmer grid while loading
  - Note Details – read note, view attachments (inline/open, download), rate/bookmark
  - My Notes – client filters (subject, query, date range, sort), quick empty states
  - Profile (self) – tabs: Overview, Notes, Saved, Analytics, Settings
  - Public Profile – overview and user’s public notes
  - Admin Users – promote/demote, activate/deactivate, delete

## Setup (Windows PowerShell)

Prereqs: Python 3.11+, Node 18+, Git, a Gmail app password (for email), and optionally a virtualenv.

1. Backend

```powershell
# From repository root
cd .\backend1\

# Create and activate venv (optional)
python -m venv venv
./venv/Scripts/Activate.ps1

# Install packages
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers

# Migrate DB and run
python manage.py migrate
python manage.py runserver
```

Environment variables (email): set before running `runserver` or in your shell profile

```powershell
$env:EMAIL_USER = "your_gmail@example.com"
$env:EMAIL_PASS = "your_app_password"
```

2. Frontend

```powershell
# New terminal at repository root
cd .\frontend1\
npm install
npm run dev
```

Vite dev server defaults to `http://localhost:5173`. The backend runs at `https://noresharing-app-fullstack-2.onrender.com`.

## Configuration notes

- CORS: `CORS_ALLOW_ALL_ORIGINS=True` for dev; lock this down in production and set `ALLOWED_HOSTS`.
- SECRET_KEY/DEBUG: Don’t commit real secrets. Use env vars and set `DEBUG=False` for production.
- Media: attachments are saved under `backend1/media/notes/<slug>/...`. Django serves these in DEBUG mode; in production, serve via your web server or object storage.

## Common flows

- Register → Login → Create notes (with optional file uploads)
- Browse homepage → filter by category, search via `?q=`
- Bookmark/rate notes; counts and averages update live
- View your profile → edit name/email/bio or change password
- Public profile pages by username/email
- Admin Users: manage roles/activation and see presence (online/last seen)

## Troubleshooting

- 401/403 on protected endpoints: ensure you’re logged in; the frontend auto‑refreshes access tokens when possible.
- Attachments not found: check `MEDIA_ROOT` exists and your files are uploaded; in production ensure your media server path is correct.
- CORS errors: verify frontend origin in Django CORS settings (`CORS_ALLOWED_ORIGINS`).

## License

This project is for educational use. Review third‑party licenses for frameworks/packages used.
