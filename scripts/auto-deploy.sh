#!/bin/bash

# Navigate to application directory
cd "$(dirname "$0")/.." || exit

# Fetch latest changes from remote main branch
git fetch origin main

# Check if local main is behind remote main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "🚀 New changes detected! Auto-deploying..."
    git pull origin main
    npm install
    npm run build
    pm2 restart daily-os || pm2 start server/index.js --name "daily-os"
    pm2 save
    echo "✅ Auto-deployment complete at $(date)"
else
    echo "ℹ️ Code is up to date. No deployment needed."
fi
