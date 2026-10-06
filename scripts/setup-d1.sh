#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npx wrangler d1 create accountants-db --binding DB --update-config
npx wrangler d1 execute accountants-db --file database/schema.sql
