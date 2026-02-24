#!/bin/bash
# Local dev startup
cd "$(dirname "$0")"
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
