"""SQLite storage. Connections are request-local; all queries use bound parameters."""
import sqlite3
from flask import current_app, g

SCHEMA = '''
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
 password_hash TEXT NOT NULL, created_at TEXT NOT NULL,
 settings TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS scans (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL, image_name TEXT NOT NULL, result TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS scans_owner_date ON scans(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS otp (
 email TEXT NOT NULL, purpose TEXT NOT NULL, code_hash TEXT NOT NULL,
 expires_at REAL NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(email, purpose)
);
CREATE TABLE IF NOT EXISTS rate_limits (
 bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS translations (
 user_id TEXT NOT NULL, cache_key TEXT NOT NULL, value TEXT NOT NULL,
 created_at REAL NOT NULL, PRIMARY KEY(user_id, cache_key)
);
CREATE TABLE IF NOT EXISTS readings (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 recorded_at TEXT NOT NULL, temperature REAL, humidity REAL, soil_moisture REAL
);
CREATE INDEX IF NOT EXISTS reading_owner ON readings(user_id, id DESC);
PRAGMA user_version=1;
'''

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(current_app.config['DATABASE'], timeout=15)
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA foreign_keys=ON')
        g.db.execute('PRAGMA busy_timeout=15000')
    return g.db


def init_db(app):
    with app.app_context():
        db = get_db()
        db.execute('PRAGMA journal_mode=WAL')
        db.executescript(SCHEMA)
    @app.teardown_appcontext
    def close_db(_error):
        db = g.pop('db', None)
        if db is not None:
            db.close()
