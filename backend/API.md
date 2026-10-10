# API contract

Default backend: http://127.0.0.1:5000. All request/response bodies are JSON except multipart image uploads and the image/CSV responses. Authentication uses the HttpOnly `krishinetra_session` cookie. Browser requests must include credentials. Every POST/PATCH/DELETE requires `X-KrishiNetra: 1`; cross-origin writes must come from an `ALLOWED_ORIGINS` entry. This header is request protection, not a secret or login token.

## Public routes

| Method | Path | Body / result |
|---|---|---|
| GET | `/api/health` | App/database health, configured model and key-present flag; does not call Gemini |
| GET | `/api/capabilities` | Language codes, upload limits and assessment limitations |
| POST | `/api/auth/register` | `{name,email,password}` → `{success,user}`, sets cookie, 201 |
| POST | `/api/auth/login` | `{email,password}` → `{success,user}`, sets cookie |
| POST | `/api/auth/logout` | `{}` → `{success}`, revokes current session |
| POST | `/api/auth/request-otp` | `{email,purpose:"login"|"reset"}` → generic message and `delivery` |
| POST | `/api/auth/verify-otp` | `{email,code}` → `{success,user}`, consumes login code, sets cookie |
| POST | `/api/auth/reset-password` | `{email,code,new_password}` → `{success,message}`, consumes reset code, revokes all sessions |

Passwords: 8–128 characters, at least one uppercase letter and number. OTP codes expire after 10 minutes and lock after five invalid attempts. Request codes at most once per minute per address. Login is rate limited by both address and source IP. SMTP settings are server-only.

## Authenticated routes

| Method | Path | Body / result |
|---|---|---|
| GET/PATCH | `/api/auth/me` | Read user; PATCH `{name}` updates profile |
| POST | `/api/predict` | multipart `file`, optional `crop`, optional `language` (`en`,`te`,`hi`,`ur`); 201 assessment |
| GET | `/api/history?page=1&limit=100` | `{history,total,page,has_more}`; maximum 100 per page |
| GET | `/api/scans/<id>` | Owner's saved assessment |
| GET | `/api/scans/<id>/image` | Owner's sanitized JPEG |
| DELETE | `/api/scans/<id>` or `/api/history/<id>` | Delete one assessment and image |
| DELETE | `/api/history` | Delete all scans/images belonging to current account |
| GET | `/api/history/export` | CSV download with formula-injection protection |
| GET | `/api/dashboard` | `{total,counts}` by assessment status |
| POST | `/api/translate` | `{scan_id,language}` (preferred) or `{assessment,language}`; cached translated assessment |
| GET | `/api/guidance/<disease>` | Saved guidance for current user, otherwise exact educational catalog match |
| GET | `/api/diseases?q=tomato` | Search the supplied educational catalog |
| GET/PATCH | `/api/settings` | `{settings}`; PATCH language, tutorial_completed, latitude, longitude |
| GET | `/api/monitoring` | Timestamped measurements, optional weather estimates and alerts |
| POST | `/api/monitoring/readings` | Actual `{temperature,humidity,soil_moisture}`; at least one, Celsius/percent |

Location may be cleared with both coordinates set to null. Temperature measurement range -60..80°C; humidity and soil moisture 0..100%. Measurements submitted through this endpoint are not automatically verified sensor readings. Weather estimates never synthesize a soil-moisture reading.

Prediction response:

```json
{
  "id": "opaque-id", "prediction_id": "opaque-id", "created_at": "ISO-8601 UTC",
  "status": "disease", "disease": "Possible condition", "crop": "Tomato",
  "confidence": 0.8, "confidence_kind": "uncalibrated_model_estimate",
  "severity": null, "affected_regions": [], "language": "en",
  "model": "gemini-3.8-flash", "image_url": "/api/scans/opaque-id/image",
  "guidance": {
    "summary": "Cautious visual assessment.", "symptoms": [], "immediate": [],
    "preventive": [], "monitoring": [], "expert": [], "management": [], "general": []
  }
}
```

Status is healthy/disease/uncertain/unsupported. Missing/low confidence causes an uncertain assessment for otherwise healthy/disease results. Non-plant/unsupported results clear disease, crop and confidence. Severity and regions are never invented. Translation preserves stored status/confidence and never overwrites the original scan.

Errors: `{error,code,request_id}` with suitable HTTP status (400,401,403,404,409,413,429,502,503,504). Some framework errors omit request_id. Rate-limit/temporary-unavailable errors may include `Retry-After`. Gemini credentials and raw upstream bodies are never returned. Missing or failing Gemini configuration produces no saved diagnosis.

The included frontend uses all core workflows automatically. CSV can also be downloaded from `/api/history/export` while signed in. External sensor clients would need authenticated requests; a dedicated device-token system is not implemented.
