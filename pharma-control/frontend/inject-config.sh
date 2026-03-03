#!/bin/sh
# Inject runtime API_URL into index.html before serving
# This runs at container start, not at build time

if [ -n "$API_URL" ]; then
  sed -i "s|</head>|<script>window.__API_URL__=\"$API_URL\";</script></head>|" dist/index.html
  echo "Injected API_URL: $API_URL"
else
  echo "WARNING: API_URL not set, using relative /api"
fi

exec npx serve dist -s -l ${PORT:-3000}
