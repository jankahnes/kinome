#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${CRON_SECRET:-}" && -r /etc/kinome/recompute.env ]]; then
  # The VPS scheduler keeps the secret root-readable outside the application
  # checkout; local/manual runs can still provide CRON_SECRET directly.
  # shellcheck disable=SC1091
  source /etc/kinome/recompute.env
fi

: "${CRON_SECRET:?CRON_SECRET must be set}"

# Hit the local Traefik listener so the nightly job never consumes Cloudflare
# or Vercel traffic. The hostname is retained for Traefik routing and TLS SNI.
curl --fail --silent --show-error --max-time 900 \
  --resolve kinome.app:443:127.0.0.1 \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  https://kinome.app/api/cron/recompute-archetype-percentiles
