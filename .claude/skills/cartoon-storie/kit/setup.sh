#!/bin/bash
# Mac: one-time setup. Safe to run again.   Run with:  bash setup.sh
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ Python 3 isn't installed. Run:  xcode-select --install   then run this again. (See START HERE.pdf)"
  exit 1
fi
python3 run.py setup
