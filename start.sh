#!/bin/bash
# NeoGesture - One command, one link: http://localhost:8000

cd "$(dirname "$0")/backend"
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
