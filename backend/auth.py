"""Password authentication, revocable sessions, throttling and one-time codes."""
import hashlib
import hmac
import json
import re
import secrets
import smtplib
import ssl
import time
from datetime import datetime, timezone
from email.message import EmailMessage
from functools import wraps
from flask import Blueprint, current_app, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash
from db import get_db
from errors import APIError

auth = Blueprint('auth', __name__, url_prefix='/api/auth')
COOKIE = 'krishinetra_session'

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def digest(text):
    return hashlib.sha256(text.encode()).hexdigest()

def body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise APIError('Send a JSON object.', 400)
    return data

def field(data, key, maximum=250, required=True):
    value = data.get(key, '')
    if not isinstance(value, str) or len(value) > maximum or (required and not value.strip()):
        raise APIError(f'Provide a valid {key}.')
    return value.strip()

def email_field(data):
    email = field(data, 'email', 254).lower()
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
        raise APIError('Provide a valid email address.')
    return email

def password_field(data, key='password'):
    password = data.get(key)
    if not isinstance(password, str) or not 8 <= len(password) <= 128 or not re.search(r'[A-Z]', password) or not re.search(r'[0-9]', password):
        raise APIError('Use 8–128 characters with an uppercase letter and a number.')
    return password

def limit(bucket, count, seconds):
    if current_app.config.get('DISABLE_RATE_LIMITS'):
        return
    db = get_db()
    now = time.time()
    with db:
        db.execute('DELETE FROM rate_limits WHERE reset_at < ?', (now,))
        row = db.execute('''INSERT INTO rate_limits(bucket,count,reset_at) VALUES(?,1,?)
          ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count, reset_at''', (bucket, now + seconds)).fetchone()
    if row['count'] > count:
        raise APIError('Too many attempts. Please wait and try again.', 429, 'rate_limited', max(1, int(row['reset_at'] - now)))

def public_user(row):
    return {'id': row['id'], 'name': row['name'], 'email': row['email'], 'createdAt': row['created_at'],
            'avatar': ''.join(part[0] for part in row['name'].split())[:2].upper(),
            'settings': json.loads(row['settings'])}

def load_user():
    g.user = None
    token = request.cookies.get(COOKIE, '')
    if token:
        g.user = get_db().execute('''SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id
            WHERE token_hash=? AND expires_at>?''', (digest(token), time.time())).fetchone()

def login_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if g.user is None:
            raise APIError('Please sign in to continue.', 401, 'unauthorized')
        return fn(*args, **kwargs)
    return wrapped

def start_session(user):
    token = secrets.token_urlsafe(32)
    db = get_db()
    with db:
        db.execute('DELETE FROM sessions WHERE expires_at < ?', (time.time(),))
        old = request.cookies.get(COOKIE)
        if old:
            db.execute('DELETE FROM sessions WHERE token_hash=?', (digest(old),))
        db.execute('INSERT INTO sessions VALUES(?,?,?)', (digest(token), user['id'], time.time() + 7 * 86400))
    response = jsonify(success=True, user=public_user(user))
    response.set_cookie(COOKIE, token, max_age=7 * 86400, httponly=True,
                        secure=current_app.config['PRODUCTION'], samesite='Lax', path='/')
    return response

@auth.post('/register')
def register():
    limit('register:' + request.remote_addr, 10, 3600)
    data = body()
    email = email_field(data)
    name = field(data, 'name', 100)
    password = password_field(data)
    db = get_db()
    import sqlite3
    try:
        with db:
            db.execute('INSERT INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)',
                       (secrets.token_hex(16), email, name, generate_password_hash(password), now_iso()))
    except sqlite3.IntegrityError:
        raise APIError('An account with this email already exists.', 409, 'account_exists') from None
    return start_session(db.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()), 201

@auth.post('/login')
def login():
    limit('login-ip:' + request.remote_addr, 30, 900)
    data = body()
    email = email_field(data)
    limit('login-email:' + digest(email), 10, 900)
    password = data.get('password', '')
    if not isinstance(password, str) or not 1 <= len(password) <= 128:
        raise APIError('Provide a valid password.')
    user = get_db().execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
    # Equal-cost password check also for unknown users.
    valid = check_password_hash(user['password_hash'] if user else current_app.config['DUMMY_PASSWORD_HASH'], password)
    if not user or not valid:
        raise APIError('Incorrect email or password.', 401, 'invalid_credentials')
    return start_session(user)

@auth.get('/me')
@login_required
def me():
    return jsonify(user=public_user(g.user))

@auth.patch('/me')
@login_required
def profile():
    data = body()
    name = field(data, 'name', 100)
    db = get_db()
    with db:
        db.execute('UPDATE users SET name=? WHERE id=?', (name, g.user['id']))
    return jsonify(success=True, user=public_user(db.execute('SELECT * FROM users WHERE id=?', (g.user['id'],)).fetchone()))

@auth.post('/logout')
def logout():
    token = request.cookies.get(COOKIE, '')
    db = get_db()
    with db:
        db.execute('DELETE FROM sessions WHERE token_hash=?', (digest(token),))
    response = jsonify(success=True)
    response.delete_cookie(COOKIE, secure=current_app.config['PRODUCTION'], httponly=True, samesite='Lax')
    return response


def send_code(email, code, purpose):
    mode = current_app.config['MAIL_MODE']
    if mode == 'console':
        if current_app.config['PRODUCTION'] or request.remote_addr not in ('127.0.0.1', '::1'):
            raise APIError('Email delivery is not configured on this server.', 503, 'mail_not_configured')
        print(f'\n[LOCAL OTP ONLY] {email} | {purpose} | code: {code} | expires in 10 minutes\n', flush=True)
        return
    if mode != 'smtp' or not current_app.config['SMTP_HOST']:
        raise APIError('Email delivery is not configured on this server.', 503, 'mail_not_configured')
    message = EmailMessage()
    message['Subject'] = 'Your KrishiNetra verification code'
    message['From'] = current_app.config['SMTP_FROM']
    message['To'] = email
    message.set_content(f'Your KrishiNetra {purpose} code is {code}. It expires in 10 minutes. If you did not request this, ignore it.')
    try:
        with smtplib.SMTP(current_app.config['SMTP_HOST'], current_app.config['SMTP_PORT'], timeout=15) as smtp:
            smtp.starttls(context=ssl.create_default_context())
            if current_app.config['SMTP_USER']:
                smtp.login(current_app.config['SMTP_USER'], current_app.config['SMTP_PASSWORD'])
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException):
        raise APIError('Could not deliver the code. Please try again later.', 503, 'mail_delivery_failed') from None

@auth.post('/request-otp')
def request_otp():
    limit('otp-ip:' + request.remote_addr, 10, 900)
    data = body()
    email = email_field(data)
    purpose = data.get('purpose', 'login')
    if purpose not in ('login', 'reset'):
        raise APIError('Purpose must be login or reset.')
    limit('otp-email:' + digest(email), 1, 60)
    if current_app.config['MAIL_MODE'] == 'console' and (current_app.config['PRODUCTION'] or request.remote_addr not in ('127.0.0.1', '::1')):
        raise APIError('Email delivery is not configured on this server.', 503, 'mail_not_configured')
    db = get_db()
    if db.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone():
        code = f'{secrets.randbelow(1000000):06d}'
        with db:
            db.execute('INSERT OR REPLACE INTO otp VALUES(?,?,?,?,0)', (email, purpose, generate_password_hash(code), time.time() + 600))
        try:
            send_code(email, code, purpose)
        except APIError:
            with db:
                db.execute('DELETE FROM otp WHERE email=? AND purpose=?', (email, purpose))
            raise
    local = current_app.config['MAIL_MODE'] == 'console'
    return jsonify(success=True, delivery='console' if local else 'email',
                   message='If the account exists, a code was printed in the backend terminal (local development only).' if local else 'If the account exists, a code was emailed. It expires in 10 minutes.')


def consume_code(email, purpose, code, new_password_hash=None):
    db = get_db()
    # Serialize verification and consumption so simultaneous requests cannot reuse a code.
    db.execute('BEGIN IMMEDIATE')
    try:
        row = db.execute('SELECT * FROM otp WHERE email=? AND purpose=?', (email, purpose)).fetchone()
        valid = row and row['expires_at'] > time.time() and row['attempts'] < 5 and check_password_hash(row['code_hash'], code)
        if not valid:
            db.execute('UPDATE otp SET attempts=attempts+1 WHERE email=? AND purpose=?', (email, purpose))
            db.commit()
            raise APIError('Invalid, expired or already used code.', 400, 'invalid_otp')
        db.execute('DELETE FROM otp WHERE email=? AND purpose=?', (email, purpose))
        user = db.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
        if new_password_hash:
            db.execute('UPDATE users SET password_hash=? WHERE id=?', (new_password_hash, user['id']))
            db.execute('DELETE FROM sessions WHERE user_id=?', (user['id'],))
            db.execute('DELETE FROM otp WHERE email=?', (email,))
        db.commit()
        return user
    except Exception:
        db.rollback()
        raise

@auth.post('/verify-otp')
def verify_otp():
    limit('verify:' + request.remote_addr, 20, 900)
    data = body()
    return start_session(consume_code(email_field(data), 'login', field(data, 'code', 6)))

@auth.post('/reset-password')
def reset_password():
    limit('reset:' + request.remote_addr, 20, 900)
    data = body()
    password = password_field(data, 'new_password')
    consume_code(email_field(data), 'reset', field(data, 'code', 6), generate_password_hash(password))
    response = jsonify(success=True, message='Password changed. Sign in with your new password.')
    response.delete_cookie(COOKIE)
    return response
