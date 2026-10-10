# Deploy KrishiNetra (voice-only update) using GitHub + Render

This source is a merger of the uploaded `krishinetra(1)(2).zip` and the
voice-only patch. `backend/app.py`, Gemini and login code have NOT changed.
The deployment uses ONE Render Docker web service for both the React
frontend and Flask API, avoiding cross-site cookies and Vercel rewrites.

## 1. Test the combined source locally

1. Extract the ZIP. Open a terminal in the inner `krishinetra` folder.
2. Copy `backend/.env.example` to `backend/.env` and put a working Gemini
   API key into `backend/.env` locally (this file is ignored by Git).
3. Run `npm ci` followed by `npm run build` to build the frontend.
4. Start the backend using a Python virtual environment and:
   `pip install -r backend/requirements.txt`; then run `python backend/app.py`.
5. Visit `http://127.0.0.1:5000` for the full app. API health:
   `http://127.0.0.1:5000/api/health`.

## 2. Push to GitHub (PowerShell)

Create an EMPTY GitHub repository named `krishinetra01` WITHOUT an automatically
created README, `.gitignore` or license. Copy its HTTPS URL (shown as
`https://github.com/25r01a05ez-sudo/krishinetra01.git` below).

Open PowerShell in this `krishinetra` project folder (the one with `package.json`).

    git init
    git branch -M main
    git add .
    git status
    git commit -m "Deploy KrishiNetra with four-language voice reading"
    git remote add origin https://github.com/25r01a05ez-sudo/krishinetra01.git
    git push -u origin main

Double-check that `.env`, `backend/.env`, `backend/instance`,
`node_modules`, and `dist` DO NOT appear in `git status` staged changes.
Never commit private API keys or login data.

If `git remote add origin` reports it already exists, use:

    git remote set-url origin https://github.com/25r01a05ez-sudo/krishinetra01.git

## 3. Deploy on Render (single full-stack service)

1. Sign in to https://dashboard.render.com/ using GitHub.
2. Choose New > Web Service > connect the `krishinetra01` repository.
3. Select Docker runtime (Render reads `Dockerfile` at repository root).
4. Choose a service name (e.g. `krishinetra-app`). Let Render build and deploy.
5. Under Render > service > Environment set:

       GEMINI_API_KEY = <your actual secret key>
       GEMINI_MODEL = <a working model ID permitted by your account>
       APP_ENV = production
       MAIL_MODE = smtp   # required for real emailed OTP / password reset
       ALLOWED_ORIGINS = https://YOUR-SERVICE-NAME.onrender.com

   The Dockerfile already configures `HOST=0.0.0.0` and `PORT=10000`.
   In Render, set `ALLOWED_ORIGINS` to the EXACT public HTTPS URL (no final slash),
   including a custom domain too if you add one. Use SMTP_HOST, SMTP_PORT,
   SMTP_FROM, SMTP_USER and SMTP_PASSWORD for real OTP email.
6. Save the environment variables and redeploy. Open your service URL.
7. Test /api/health, registration, login, scan results and speech playback.

## 4. CRITICAL: Account data persistence

The app uses SQLite with local image uploads under `backend/instance`.
Many ephemeral hosting plans erase these files at restart or redeploy.
For real users, configure persistent storage (Render persistent disk or a
suitable alternative) at path `/app/backend/instance` BEFORE storing data.
Do not publish the app for real users relying on persistent accounts without
appropriate durable storage and backups.

Render disk availability depends on the service plan. Database migrations to
a managed database are NOT included in this patch.

## 5. Important production notes

- The `GEMINI_API_KEY` is a SECRET server-side Render environment value only.
  Do not put it in `.env` committed to Git or any `VITE_` key.
- `MAIL_MODE=console` is for local debugging only. Production OTP requires SMTP.
- Browser speech works via SpeechSynthesis; users need matching English,
  Hindi, Telugu and Urdu voices installed/enabled on their device.
- Backend assessment translation still depends on the configured Gemini API.
- This bundle DOES NOT include a Vercel deployment config: the recommended
  Render-only method deliberately serves the UI and API together for stable
  authentication. If you prefer frontend Vercel + backend Render, ask for a
  Vercel `/api` proxy rewrite configuration before deploying.

## Later GitHub updates

From the same project folder:

    git add .
    git commit -m "Update KrishiNetra"
    git push

Render can automatically redeploy when the connected branch changes.
