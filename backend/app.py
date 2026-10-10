"""KrishiNetra API and optional built-frontend server. Run: python app.py"""
import csv
import hashlib
import io
import json
import math
import os
import re
import secrets
import time
import warnings
from pathlib import Path
from datetime import datetime, timezone
import requests
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
from PIL import Image, ImageOps, UnidentifiedImageError
from werkzeug.exceptions import HTTPException
from werkzeug.security import generate_password_hash
from auth import auth, body, field, limit, load_user, login_required, now_iso, public_user
from db import get_db, init_db
from errors import APIError
from gemini import GeminiClient, LANGUAGES, validate_assessment

BASE = Path(__file__).resolve().parent
load_dotenv(BASE / '.env')
Image.MAX_IMAGE_PIXELS = 24_000_000


def create_app(config=None):
    app = Flask(__name__, static_folder=None)
    data_dir = Path(os.getenv('DATA_DIR', str(BASE / 'instance'))).resolve()
    app.config.update(
        DATABASE=str(data_dir / 'krishinetra.sqlite3'), UPLOAD_DIR=str(data_dir / 'uploads'),
        MAX_CONTENT_LENGTH=11 * 1024 * 1024,
        PRODUCTION=os.getenv('APP_ENV', 'development') == 'production',
        MAIL_MODE=os.getenv('MAIL_MODE', 'console'),
        SMTP_HOST=os.getenv('SMTP_HOST', ''), SMTP_PORT=int(os.getenv('SMTP_PORT', '587')),
        SMTP_FROM=os.getenv('SMTP_FROM', ''), SMTP_USER=os.getenv('SMTP_USER', ''),
        SMTP_PASSWORD=os.getenv('SMTP_PASSWORD', ''),
        GEMINI_API_KEY=os.getenv('GEMINI_API_KEY', ''), GEMINI_MODEL=os.getenv('GEMINI_MODEL', 'gemini-3.8-flash'),
        FRONTEND_DIR=str(BASE.parent / 'dist'),
        ALLOWED_ORIGINS=[x.strip() for x in os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,http://127.0.0.1:5000').split(',') if x.strip()],
        DUMMY_PASSWORD_HASH=generate_password_hash(secrets.token_urlsafe(24)),
    )
    if config:
        app.config.update(config)
    if not re.fullmatch(r'[a-zA-Z0-9._-]+', app.config['GEMINI_MODEL']):
        raise ValueError('GEMINI_MODEL must be a model ID, not a URL.')
    Path(app.config['DATABASE']).parent.mkdir(parents=True, exist_ok=True)
    Path(app.config['UPLOAD_DIR']).mkdir(parents=True, exist_ok=True)
    init_db(app)
    app.extensions['gemini'] = GeminiClient(app.config['GEMINI_API_KEY'], app.config['GEMINI_MODEL'])
    CORS(app, resources={r'/api/*': {'origins': app.config['ALLOWED_ORIGINS']}}, supports_credentials=True,
         allow_headers=['Content-Type', 'X-KrishiNetra'])
    app.register_blueprint(auth)

    @app.before_request
    def before():
        g.request_id = secrets.token_hex(8)
        if request.path.startswith('/api/'):
            if request.method not in ('GET', 'HEAD', 'OPTIONS'):
                if request.headers.get('X-KrishiNetra') != '1':
                    raise APIError('Missing request protection header.', 403, 'csrf_rejected')
                origin = request.headers.get('Origin')
                if origin and origin not in app.config['ALLOWED_ORIGINS']:
                    raise APIError('This origin is not allowed.', 403, 'origin_rejected')
            load_user()

    @app.after_request
    def after(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'same-origin'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Request-ID'] = getattr(g, 'request_id', '')
        if request.path.startswith('/api/'):
            response.headers['Cache-Control'] = 'no-store'
        return response

    @app.errorhandler(APIError)
    def api_error(error):
        response = jsonify(error=error.message, code=error.code, request_id=getattr(g, 'request_id', ''))
        response.status_code = error.status
        if error.retry_after:
            response.headers['Retry-After'] = str(error.retry_after)
        return response

    @app.errorhandler(HTTPException)
    def http_error(error):
        message = 'Image or request is too large (10 MB image limit).' if error.code == 413 else error.description
        return jsonify(error=message, code='http_error'), error.code

    @app.errorhandler(Exception)
    def unexpected(error):
        # Exception messages may contain upstream credentials. Log only type + request ID.
        app.logger.error('Request %s failed: %s', getattr(g, 'request_id', ''), type(error).__name__)
        return jsonify(error='An unexpected server error occurred. Please retry.', code='internal_error', request_id=getattr(g, 'request_id', '')), 500

    @app.get('/api/health')
    def health():
        get_db().execute('SELECT 1')
        return jsonify(status='ok', database='ok', gemini_configured=bool(app.config['GEMINI_API_KEY']),
                       model=app.config['GEMINI_MODEL'], languages=list(LANGUAGES), version='1.0.0',
                       mail_mode=app.config['MAIL_MODE'])

    @app.get('/api/capabilities')
    def capabilities():
        return jsonify(model=app.config['GEMINI_MODEL'], languages=LANGUAGES,
                       max_image_mb=10, image_types=['image/jpeg', 'image/png', 'image/webp'],
                       assessment_type='AI visual assessment, not confirmed diagnosis',
                       measured_severity=False, lesion_localization=False, calibrated_confidence=False,
                       otp_delivery=app.config['MAIL_MODE'])

    def language(value):
        if not isinstance(value, str) or value not in LANGUAGES:
            raise APIError('Language must be en, hi, te or ur.')
        return value

    def image_bytes(upload):
        if upload is None or not upload.filename:
            raise APIError('Upload a JPG, PNG or WebP using the file field.')
        raw = upload.read(10 * 1024 * 1024 + 1)
        if len(raw) > 10 * 1024 * 1024:
            raise APIError('Image is too large. Maximum size is 10 MB.', 413, 'image_too_large')
        try:
            with warnings.catch_warnings():
                warnings.simplefilter('error', Image.DecompressionBombWarning)
                with Image.open(io.BytesIO(raw)) as probe:
                    if probe.format not in ('JPEG', 'PNG', 'WEBP') or getattr(probe, 'n_frames', 1) > 1:
                        raise APIError('Use a still JPG, PNG or WebP image.')
                    probe.verify()
                with Image.open(io.BytesIO(raw)) as source:
                    if min(source.size) < 32:
                        raise APIError('Image is too small. Use a clear photo at least 32 pixels wide and high.')
                    image = ImageOps.exif_transpose(source).convert('RGB')
                    image.thumbnail((1600, 1600))
                    stream = io.BytesIO()
                    image.save(stream, format='JPEG', quality=88)
                    return stream.getvalue()
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning):
            raise APIError('This file is not a valid supported image, or its dimensions are too large.', 400, 'invalid_image') from None

    def scan_json(row, include_image=True):
        result = json.loads(row['result'])
        result.update(id=row['id'], prediction_id=row['id'], created_at=row['created_at'])
        if include_image:
            result['image_url'] = f"/api/scans/{row['id']}/image"
        return result

    def own_scan(scan_id):
        row = get_db().execute('SELECT * FROM scans WHERE id=? AND user_id=?', (scan_id, g.user['id'])).fetchone()
        if not row:
            raise APIError('Scan not found.', 404, 'not_found')
        return row

    @app.post('/api/predict')
    @login_required
    def predict():
        limit('predict:' + g.user['id'], 30, 3600)
        crop = request.form.get('crop', '').strip()
        if len(crop) > 100:
            raise APIError('Crop name is too long.')
        lang = language(request.form.get('language', 'en'))
        image = image_bytes(request.files.get('file'))
        result = app.extensions['gemini'].assess(image, crop, lang)
        scan_id = secrets.token_hex(16)
        filename = scan_id + '.jpg'
        path = Path(app.config['UPLOAD_DIR']) / filename
        created = now_iso()
        try:
            path.write_bytes(image)
            db = get_db()
            with db:
                db.execute('INSERT INTO scans VALUES(?,?,?,?,?)', (scan_id, g.user['id'], created, filename, json.dumps(result, ensure_ascii=False)))
        except Exception:
            path.unlink(missing_ok=True)
            raise
        return jsonify(**result, id=scan_id, prediction_id=scan_id, created_at=created,
                       image_url=f'/api/scans/{scan_id}/image'), 201

    @app.get('/api/history')
    @login_required
    def history():
        try:
            page = max(1, int(request.args.get('page', 1)))
            size = min(100, max(1, int(request.args.get('limit', 100))))
        except ValueError:
            raise APIError('Page and limit must be numbers.') from None
        db = get_db()
        total = db.execute('SELECT COUNT(*) FROM scans WHERE user_id=?', (g.user['id'],)).fetchone()[0]
        rows = db.execute('SELECT * FROM scans WHERE user_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?',
                          (g.user['id'], size, (page - 1) * size)).fetchall()
        return jsonify(history=[scan_json(r) for r in rows], total=total, page=page, has_more=page * size < total)

    @app.get('/api/scans/<scan_id>')
    @login_required
    def get_scan(scan_id):
        return jsonify(scan_json(own_scan(scan_id)))

    @app.get('/api/scans/<scan_id>/image')
    @login_required
    def scan_image(scan_id):
        row = own_scan(scan_id)
        return send_from_directory(app.config['UPLOAD_DIR'], row['image_name'], mimetype='image/jpeg')

    @app.delete('/api/history/<scan_id>')
    @app.delete('/api/scans/<scan_id>')
    @login_required
    def delete_scan(scan_id):
        row = own_scan(scan_id)
        db = get_db()
        with db:
            db.execute('DELETE FROM scans WHERE id=? AND user_id=?', (scan_id, g.user['id']))
            db.execute('DELETE FROM translations WHERE user_id=?', (g.user['id'],))
        (Path(app.config['UPLOAD_DIR']) / row['image_name']).unlink(missing_ok=True)
        return jsonify(success=True)

    @app.delete('/api/history')
    @login_required
    def clear_history():
        db = get_db()
        rows = db.execute('SELECT image_name FROM scans WHERE user_id=?', (g.user['id'],)).fetchall()
        with db:
            db.execute('DELETE FROM scans WHERE user_id=?', (g.user['id'],))
            db.execute('DELETE FROM translations WHERE user_id=?', (g.user['id'],))
        for row in rows:
            (Path(app.config['UPLOAD_DIR']) / row['image_name']).unlink(missing_ok=True)
        return jsonify(success=True, deleted=len(rows))

    @app.get('/api/history/export')
    @login_required
    def export_history():
        rows = get_db().execute('SELECT * FROM scans WHERE user_id=? ORDER BY created_at DESC', (g.user['id'],)).fetchall()
        stream = io.StringIO()
        writer = csv.writer(stream)
        writer.writerow(['ID', 'Date', 'Crop', 'Possible disease', 'Status', 'Uncalibrated confidence', 'Summary'])
        def safe(value):
            text = '' if value is None else str(value)
            return "'" + text if text.lstrip().startswith(('=', '+', '-', '@', '\t', '\r')) else text
        for row in rows:
            r = scan_json(row)
            writer.writerow([safe(x) for x in (r['id'], r['created_at'], r.get('crop'), r.get('disease'), r['status'], r.get('confidence'), r.get('guidance', {}).get('summary'))])
        return send_file(io.BytesIO(stream.getvalue().encode('utf-8-sig')), mimetype='text/csv', as_attachment=True, download_name='KrishiNetra_Scan_History.csv')

    @app.get('/api/dashboard')
    @login_required
    def dashboard():
        rows = get_db().execute('SELECT result FROM scans WHERE user_id=?', (g.user['id'],)).fetchall()
        counts = {key: 0 for key in ('healthy', 'disease', 'uncertain', 'unsupported')}
        for row in rows:
            status = json.loads(row['result'])['status']
            counts[status] += 1
        return jsonify(total=len(rows), counts=counts)

    @app.post('/api/translate')
    @login_required
    def translate():
        limit('translate:' + g.user['id'], 60, 3600)
        data = body()
        lang = language(data.get('language', 'en'))
        if data.get('scan_id'):
            original = json.loads(own_scan(field(data, 'scan_id', 64))['result'])
        else:
            if len(json.dumps(data)) > 30000:
                raise APIError('Assessment is too large.')
            try:
                original = validate_assessment(data.get('assessment'))
            except APIError:
                raise APIError('Provide a scan_id or a complete valid assessment.') from None
        if original.get('language') == lang:
            return jsonify(original)
        key = hashlib.sha256((lang + json.dumps(original, sort_keys=True)).encode()).hexdigest()
        db = get_db()
        cached = db.execute('SELECT value FROM translations WHERE user_id=? AND cache_key=?', (g.user['id'], key)).fetchone()
        if cached:
            return jsonify(json.loads(cached['value']))
        translated = app.extensions['gemini'].translate(original, lang)
        with db:
            db.execute('DELETE FROM translations WHERE created_at<?', (time.time() - 30 * 86400,))
            db.execute('INSERT OR REPLACE INTO translations VALUES(?,?,?,?)', (g.user['id'], key, json.dumps(translated, ensure_ascii=False), time.time()))
        return jsonify(translated)

    @app.get('/api/guidance/<path:disease>')
    @login_required
    def guidance(disease):
        # Prefer the user's actual assessment over a generic disease-name match.
        rows = get_db().execute('SELECT result FROM scans WHERE user_id=? ORDER BY created_at DESC', (g.user['id'],)).fetchall()
        for row in rows:
            result = json.loads(row['result'])
            if (result.get('disease') or '').casefold() == disease.casefold():
                return jsonify(guidance=result['guidance'], source='saved_ai_assessment', human_reviewed=False)
        catalog = json.loads((BASE / 'data' / 'diseases.json').read_text(encoding='utf-8'))
        for item in catalog:
            if item['disease'].casefold() == disease.casefold() or item['id'].casefold() == disease.casefold():
                return jsonify(guidance={'summary': item['disease'] + ': ' + item['expertCheck'],
                                         'symptoms': item['symptoms'], 'preventive': item['nonchemicalPrevention'],
                                         'expert': [item['expertCheck']]}, source='educational_reference', human_reviewed=False)
        raise APIError('No saved guidance for this condition. Analyse a crop photo first.', 404, 'not_found')

    @app.get('/api/diseases')
    @login_required
    def diseases():
        catalog = json.loads((BASE / 'data' / 'diseases.json').read_text(encoding='utf-8'))
        q = request.args.get('q', '').casefold()
        return jsonify(diseases=[x for x in catalog if q in (x['crop'] + ' ' + x['disease']).casefold()], human_reviewed=False)

    @app.route('/api/settings', methods=['GET', 'PATCH'])
    @login_required
    def settings():
        settings = json.loads(g.user['settings'])
        if request.method == 'PATCH':
            data = body()
            if set(data) - {'language', 'tutorial_completed', 'latitude', 'longitude'}:
                raise APIError('Unknown settings field.')
            if 'language' in data:
                language(data['language'])
            if 'tutorial_completed' in data and not isinstance(data['tutorial_completed'], bool):
                raise APIError('tutorial_completed must be true or false.')
            merged = {**settings, **data}
            for name, bound in [('latitude', 90), ('longitude', 180)]:
                if name in merged and merged[name] is not None:
                    number(merged[name], name, -bound, bound)
            if (merged.get('latitude') is None) != (merged.get('longitude') is None):
                raise APIError('Set both latitude and longitude.')
            settings = merged
            db = get_db()
            with db:
                db.execute('UPDATE users SET settings=? WHERE id=?', (json.dumps(settings), g.user['id']))
        return jsonify(settings=settings)

    def number(value, name, low, high):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
            raise APIError(f'{name} must be a number between {low} and {high}.')
        return value

    @app.post('/api/monitoring/readings')
    @login_required
    def reading():
        limit('readings:' + g.user['id'], 120, 3600)
        data = body()
        values = []
        for name, lo, hi in [('temperature', -60, 80), ('humidity', 0, 100), ('soil_moisture', 0, 100)]:
            value = data.get(name)
            values.append(None if value is None else number(value, name, lo, hi))
        if all(v is None for v in values):
            raise APIError('Provide at least one measurement.')
        db = get_db()
        with db:
            db.execute('INSERT INTO readings(user_id,recorded_at,temperature,humidity,soil_moisture) VALUES(?,?,?,?,?)', (g.user['id'], now_iso(), *values))
        return jsonify(success=True), 201

    @app.get('/api/monitoring')
    @login_required
    def monitoring():
        limit('monitoring:' + g.user['id'], 60, 3600)
        settings = json.loads(g.user['settings'])
        row = get_db().execute('SELECT * FROM readings WHERE user_id=? ORDER BY id DESC LIMIT 1', (g.user['id'],)).fetchone()
        out = {'temperature': None, 'humidity': None, 'soil_moisture': None, 'weather': None, 'alerts': [], 'source': None}
        if row:
            out['source'] = 'submitted_measurements'
            for name, unit in [('temperature', '°C'), ('humidity', '%'), ('soil_moisture', '%')]:
                if row[name] is not None:
                    out[name] = {'value': row[name], 'unit': unit, 'updated_at': row['recorded_at']}
            if (datetime.now(timezone.utc) - datetime.fromisoformat(row['recorded_at'])).total_seconds() > 3600:
                out['alerts'].append('Submitted measurements are over an hour old. Check the timestamp before acting.')
        if settings.get('latitude') is not None and settings.get('longitude') is not None:
            try:
                response = requests.get('https://api.open-meteo.com/v1/forecast', params={
                    'latitude': settings['latitude'], 'longitude': settings['longitude'],
                    'current': 'temperature_2m,relative_humidity_2m,precipitation', 'timezone': 'UTC'}, timeout=(5, 10))
                response.raise_for_status()
                weather = response.json()['current']
                stamp = weather['time'] + 'Z'
                temp = number(weather['temperature_2m'], 'temperature', -100, 100)
                humidity = number(weather['relative_humidity_2m'], 'humidity', 0, 100)
                if out['temperature'] is None:
                    out['temperature'] = {'value': temp, 'unit': '°C', 'updated_at': stamp}
                if out['humidity'] is None:
                    out['humidity'] = {'value': humidity, 'unit': '%', 'updated_at': stamp}
                out['weather'] = f"Open-Meteo weather estimate at {settings['latitude']}, {settings['longitude']}: {temp} °C, {humidity}% humidity. Not an on-farm sensor reading."
                out['source'] = 'submitted_measurements_and_open_meteo' if row else 'open_meteo'
                out['attribution'] = 'Weather data: Open-Meteo (CC BY 4.0)'
            except (requests.RequestException, KeyError, ValueError, TypeError, APIError):
                out['alerts'].append('Weather service is unavailable. Any submitted measurements are still shown with their timestamps.')
        if out['humidity'] and out['humidity']['value'] >= 85:
            out['alerts'].append('High humidity can favour some crop diseases. Check leaves and ventilation; this is not a disease diagnosis.')
        if out['temperature'] and out['temperature']['value'] >= 35:
            out['alerts'].append('High temperature: inspect crops for heat stress and check soil moisture before watering.')
        if out['source'] is None and not out['alerts']:
            out['alerts'].append('Set your farm location in Settings for weather estimates, or submit actual measurements. No soil sensor is connected automatically.')
        return jsonify(out)

    @app.get('/')
    @app.get('/<path:path>')
    def frontend(path=''):
        if path.startswith('api/'):
            raise APIError('API route not found.', 404, 'not_found')
        folder = Path(app.config['FRONTEND_DIR'])
        candidate = (folder / path).resolve()
        if path and candidate.is_relative_to(folder.resolve()) and candidate.is_file():
            return send_from_directory(folder, path)
        if (folder / 'index.html').is_file():
            return send_from_directory(folder, 'index.html')
        return jsonify(message='KrishiNetra backend is running. Start the frontend at http://localhost:5173.', health='/api/health')

    return app


if __name__ == '__main__':
    from waitress import serve
    app = create_app()
    host = os.getenv('HOST', '127.0.0.1')
    port = int(os.getenv('PORT', '5000'))
    print(f'KrishiNetra running at http://{host}:{port} | model: {app.config["GEMINI_MODEL"]}', flush=True)
    if not app.config['GEMINI_API_KEY']:
        print('Add GEMINI_API_KEY in backend/.env and restart to enable AI diagnosis.', flush=True)
    serve(app, host=host, port=port, threads=8, max_request_body_size=11 * 1024 * 1024)
