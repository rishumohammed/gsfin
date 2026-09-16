#!/bin/sh
set -e

echo "=== [GSFIN Backend] Initializing Container ==="

# Ensure required upload directories exist in the persistent volume
mkdir -p /app/uploads/recordings /app/uploads/screenshots /app/uploads/certificates

# Wait for MySQL to be accessible
echo "Waiting for MySQL database at ${DB_HOST}:${DB_PORT:-3306}..."
node -e '
const net = require("net");
const host = process.env.DB_HOST || "mysql";
const port = parseInt(process.env.DB_PORT || "3306", 10);
let retries = 30;

function check() {
  const client = net.createConnection({ host, port }, () => {
    console.log("Database port is open!");
    client.end();
    process.exit(0);
  });
  client.on("error", (err) => {
    retries--;
    if (retries <= 0) {
      console.error("Could not connect to database after multiple attempts.");
      process.exit(1);
    }
    setTimeout(check, 2000);
  });
}
check();
'

# Run database migrations
echo "Running database migrations..."
node src/db/migrate.js || {
  echo "Migration failed or encountered a non-fatal error. Continuing..."
}

echo "=== [GSFIN Backend] Starting Server ==="
exec "$@"
