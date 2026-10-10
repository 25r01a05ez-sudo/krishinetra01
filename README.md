# KrishiNetra — connected frontend and Flask backend

## Start on Windows — no frontend build required

1. Extract this ZIP into a **new folder**. Python 3.11 or newer must be installed.
2. Open `backend/.env` in Notepad and put your key after `GEMINI_API_KEY=`. Keep `GEMINI_MODEL=gemini-3.8-flash`.
3. Double-click `START_KRISHINETRA.bat`. It creates a virtual environment, installs dependencies and starts the application.
4. Open **http://127.0.0.1:5000**. Register a new account. Your old browser-only account is not a backend account.
5. Keep Demo Mode **off** for real Gemini analysis. Upload a clear crop photo from New Diagnosis.

The ready-built frontend is included in `dist/`; Node is not required to use it. The first install needs internet access. If the browser opens before the server is ready, refresh after the terminal says the server is running. Keep that terminal open; Ctrl+C stops the server.

**Only the Gemini key is required for the local AI workflow.** No database credentials or manually chosen application secret are needed: SQLite initializes automatically and sessions use cryptographically random tokens. Do not put your key in the frontend or send it in chat. Restart the backend after changing `.env`.

## Included

- Flask API with Waitress, SQLite initialization and per-request database connections.
- Server registration, login, logout, profile updates, scrypt password hashes and revocable HttpOnly cookie sessions.
- One-time-code login and password reset: 10-minute expiry, attempt limit, throttling, single use and session revocation on reset.
- JPG/PNG/WebP validation by decoding actual image bytes; 10 MB upload limit, pixel limit, EXIF orientation correction, metadata removal and resizing before Gemini.
- Gemini 3.8 Flash visual assessment, structured response checks, explicit uncertainty, unsupported-image responses, bounded retries, timeout/quota/network errors. No demo fallback on failures.
- Private persistent scan history and images, individual/all deletion, pagination, CSV export and dashboard statistics.
- English, Hindi, Telugu and Urdu assessment generation and cached result translation. Existing interface dictionaries are preserved; some auxiliary interface labels remain English.
- Read-next-steps controls with speed adjustment using browser speech synthesis. Voices depend on the browser/operating system; no audio is silently played and no paid voice API is required.
- First-account walkthrough with Skip and completion stored per account, in the four supported languages. This is an interactive text walkthrough, not a prerecorded video.
- Educational disease reference endpoint using the supplied project catalog. Entries and AI guidance are not represented as human reviewed.
- Farm coordinates in Settings, Open-Meteo weather estimates without an extra API key, measurement ingestion and timestamped environmental alerts. No fabricated soil-sensor measurements.
- Connected frontend: real login, results, translations, history/delete, recovery forms, read-aloud controls, tutorial and farm settings.

## OTP delivery: local vs email

Default `MAIL_MODE=console` prints a verification code in the **backend terminal** on your computer. The UI explicitly tells you to read it there. It does not claim to send an email. This allows local OTP and reset testing with only the Gemini key. Console delivery is rejected for non-loopback requests and when `APP_ENV=production`.

For actual email delivery, configure your mail provider separately in `backend/.env`:

```dotenv
MAIL_MODE=smtp
SMTP_HOST=your-provider-smtp-host
SMTP_PORT=587
SMTP_FROM=your-verified-sender@example.com
SMTP_USER=your-provider-username
SMTP_PASSWORD=your-provider-password
```

SMTP uses STARTTLS with certificate verification. A Gemini API key cannot send verification emails. SMS OTP is not included. Never expose console OTP mode publicly through a tunnel or reverse proxy.

## Develop using the original port 5173

Open one terminal in `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

Open another terminal in the project root:

```powershell
npm ci
npm run dev
```

Visit **http://localhost:5173/diagnosis** and sign in. Vite forwards `/api` to Flask at `127.0.0.1:5000`; cookies and protected images stay on one browser origin. Use one hostname consistently. Do not set a frontend Gemini key. If you carried over an old root `.env`, remove its `VITE_API_BASE_URL` value to use the supplied proxy.

After frontend changes run `npm run build` to update `dist/` for the one-server launcher.

macOS/Linux: run `bash start.sh`, then open http://127.0.0.1:5000.

## Health check and common problems

Open `/api/health` on the running server. `status: ok` checks the app/database; `gemini_configured` only checks whether a key was supplied. It does **not** prove that Google accepted the key.

- `gemini_not_configured`: add the key to `backend/.env`, restart the backend.
- `gemini_rejected`: check key validity, API restrictions and model access in Google AI Studio.
- `gemini_model_unavailable`: verify that your key can use `gemini-3.8-flash`. `GEMINI_MODEL` is configurable; the UI needs no changes.
- `gemini_quota`: check quota/billing or wait for the reported retry interval.
- `gemini_timeout` / `gemini_unavailable`: retry later; these failures never create a fake scan.
- `unauthorized`: sign in again. All scan/image access requires a valid session.
- Missing speech voice: install a language voice in your operating system or read the displayed text.
- Empty weather: set both farm coordinates in Settings and refresh Monitoring. Weather needs internet access. Soil moisture requires a real submitted measurement.

## Data and privacy

Runtime files are created in `backend/instance/`: database, session hashes, scan results and sanitized JPEGs. Each account only sees its own records and images. The Gemini key stays in backend configuration; Google receives the resized crop image, crop hint and language for analysis. Avoid uploading personal documents or identifiable people.

Live results are automatically stored on the server. Delete one from History or all from Settings. Demo samples stay separate. Legacy frontend-only credentials and unscoped local scan copies are removed; they are not imported because their passwords and ownership were not securely established. Back up the `instance` directory with the application stopped before moving computers. The delivered ZIP contains no user accounts, database, uploads, API key or virtual environment.

## Deployment

The launcher is for local use and binds to loopback. For a hosted deployment, use the included Flask/Waitress server behind an HTTPS reverse proxy with persistent disk. Serve `dist` and `/api` under **one origin**. Set `APP_ENV=production`, configure SMTP, set `ALLOWED_ORIGINS` to your exact HTTPS origin, and set HOST/PORT for the host environment. Production session cookies require HTTPS. Do not deploy this backend as a static-only Vercel build. Multiple replicas need shared database/storage and distributed controls; this SQLite version is a single-host application.

Gemini assessments are not a trained/validated crop-specific classifier. Confidence is an uncalibrated model estimate; measured severity and lesion boxes are deliberately absent. Confirm a suspected disease with an agricultural specialist before treatment. No claim of diagnostic accuracy has been tested here.

## Verification

From `backend`:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
```

Tests cover accounts/sessions, request protection, image validation, owner-only scans/images, history deletion, translation cache, OTP expiry/reuse/attempts, password-reset revocation, settings/monitoring, quotas/timeouts, malformed Gemini results, rate limits and pagination. AI responses in automated tests are simulated. A live Gemini diagnosis cannot be verified until you provide a valid key with model access and quota.

Verified in this workspace: 14 backend tests passed; the production frontend build passed. A headless browser passed registration, tutorial skipping, upload with a simulated model response, result display, persistence after refresh, deletion and farm settings without JavaScript page errors. Live Gemini, SMTP delivery and real sensor hardware were not exercised.

See `backend/API.md` for endpoint contracts.

Sources for integration: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash ; https://ai.google.dev/api/generate-content ; https://ai.google.dev/gemini-api/docs/generate-content/structured-output ; https://open-meteo.com/en/docs
