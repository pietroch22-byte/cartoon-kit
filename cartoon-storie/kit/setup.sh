#!/bin/bash
# Mac: installazione una tantum (si può rifare).  bash kit/setup.sh
cd "$(dirname "$0")" || exit 1
python3 run.py setup
