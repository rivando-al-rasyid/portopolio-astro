#!/bin/sh
set -eu

node ./dist/server/entry.mjs &
NODE_PID="$!"

nginx -g 'daemon off;' &
NGINX_PID="$!"

trap 'kill "$NODE_PID" "$NGINX_PID" 2>/dev/null || true' INT TERM

while true; do
  if ! kill -0 "$NODE_PID" 2>/dev/null; then
    echo "Astro node server stopped"
    kill "$NGINX_PID" 2>/dev/null || true
    wait "$NODE_PID" || exit $?
    exit 1
  fi

  if ! kill -0 "$NGINX_PID" 2>/dev/null; then
    echo "Nginx stopped"
    kill "$NODE_PID" 2>/dev/null || true
    wait "$NGINX_PID" || exit $?
    exit 1
  fi

  sleep 2
done
