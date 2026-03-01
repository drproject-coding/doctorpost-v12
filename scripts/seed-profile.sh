#!/usr/bin/env bash
# Seed the Doctor Project brand profile via CLI.
# Usage: ./scripts/seed-profile.sh [email] [password]

BASE_URL="${BASE_URL:-http://localhost:3000}"

EMAIL="${1:-}"
PASSWORD="${2:-}"

if [ -z "$EMAIL" ]; then
  printf "Email: "
  read -r EMAIL
fi
if [ -z "$PASSWORD" ]; then
  printf "Password: "
  read -rs PASSWORD
  echo
fi

COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"' EXIT

echo "Signing in as $EMAIL..."
LOGIN_RES=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/auth/sign-in/email" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RES" | tail -1)
LOGIN_BODY=$(echo "$LOGIN_RES" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo "Login failed (HTTP $HTTP_CODE): $LOGIN_BODY"
  exit 1
fi

echo "Logged in. Seeding profile..."
SEED_RES=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/seed-profile" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR")

HTTP_CODE=$(echo "$SEED_RES" | tail -1)
SEED_BODY=$(echo "$SEED_RES" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "Profile seeded successfully!"
  echo "$SEED_BODY" | python3 -m json.tool 2>/dev/null || echo "$SEED_BODY"
else
  echo "Seed failed (HTTP $HTTP_CODE): $SEED_BODY"
  exit 1
fi
