#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -x backend/.venv/bin/python ]; then python3 -m venv backend/.venv; fi
if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; fi
backend/.venv/bin/python -m pip install -r backend/requirements.txt
exec backend/.venv/bin/python backend/app.py
