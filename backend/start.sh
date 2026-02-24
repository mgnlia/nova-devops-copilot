#!/bin/bash
# Local dev startup
cd "$(dirname "$0")"
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
