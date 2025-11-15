#!/bin/sh
set -e

# --- Wait for Kong Admin API ---
echo "Waiting for Kong Admin API..."
while ! curl -s -f -o /dev/null http://kong-gateway:8001/status; do
  echo -n .
  sleep 1
done
echo "Kong status is ready!"

# --- CONFIGURATION VIA IMPERATIVE API CALLS ---

# Step 1: Upsert Services
echo "Upserting 'authentication-service'..."
curl -s -f -X PUT http://kong-gateway:8001/services/authentication-service --data "name=authentication-service" --data "url=http://authentication-service:3002"
echo "Upserting 'booking-service'..."
curl -s -f -X PUT http://kong-gateway:8001/services/booking-service --data "name=booking-service" --data "url=http://booking-service:3003"

# Step 2: Upsert Routes
echo "Upserting 'auth-login-route' (UNPROTECTED)..."
curl -s -f -X PUT http://kong-gateway:8001/services/authentication-service/routes/auth-login-route -H "Content-Type: application/json" --data '{"name": "auth-login-route", "paths": ["/auth/login"], "strip_path": false}'
echo "Upserting 'auth-protected-route' (PROTECTED)..."
curl -s -f -X PUT http://kong-gateway:8001/services/authentication-service/routes/auth-protected-route -H "Content-Type: application/json" --data '{"name": "auth-protected-route", "paths": ["/auth/me"], "strip_path": false}'
echo "Upserting 'booking-routes' (PROTECTED)..."
curl -s -f -X PUT http://kong-gateway:8001/services/booking-service/routes/booking-routes -H "Content-Type: application/json" --data '{"name": "booking-routes", "paths": ["/booking"], "strip_path": true}'

# Step 3: Upsert Consumer
echo "Upserting consumer 'generic-scams-user'..."
curl -s -f -X PUT http://kong-gateway:8001/consumers/generic-scams-user --data "username=generic-scams-user"

# Step 4: Apply JWT Plugin PER PROTECTED ROUTE (DEFINITIVE FIX)
# We will NOT apply plugins at the service level.
echo "Applying JWT plugin to 'auth-protected-route'..."
curl -s -f -X POST http://kong-gateway:8001/routes/auth-protected-route/plugins -H "Content-Type: application/json" --data '{"name": "jwt", "config": {"key_claim_name": "iss"}}' || true
echo "Applying JWT plugin to 'booking-routes'..."
curl -s -f -X POST http://kong-gateway:8001/routes/booking-routes/plugins -H "Content-Type: application/json" --data '{"name": "jwt", "config": {"key_claim_name": "iss"}}' || true

# Step 5: Re-create the JWT Credential for the Consumer
echo "Creating JWT credential for the consumer..."
curl -s -f -X DELETE http://kong-gateway:8001/consumers/generic-scams-user/jwt/generic-scams-user || true
curl -s -f -X POST http://kong-gateway:8001/consumers/generic-scams-user/jwt --data "key=generic-scams-user" --data "secret=${JWT_SECRET}"


# Add a route for the debug crash endpoint.
# NOTE: In a real production system, this route would be heavily firewalled
# or removed entirely.
echo "Upserting 'auth-debug-crash-route' (PROTECTED)..."
curl -s -f -X PUT http://kong-gateway:8001/services/authentication-service/routes/auth-debug-crash-route \
  -H "Content-Type: application/json" \
  --data '{
    "name": "auth-debug-crash-route",
    "paths": ["/auth/debug/crash"],
    "strip_path": false
  }'

# IMPORTANT: We must also apply the JWT plugin to this new route
echo "Applying JWT plugin to 'auth-debug-crash-route'..."
curl -s -f -X POST http://kong-gateway:8001/routes/auth-debug-crash-route/plugins \
  -H "Content-Type: application/json" \
  --data '{"name": "jwt", "config": {"key_claim_name": "iss"}}' || true

echo "Kong configuration is complete and robust."