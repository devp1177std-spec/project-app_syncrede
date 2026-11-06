const net = require('net');

function checkPort(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(true);
      }
    });

    socket.on('timeout', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.on('error', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.connect(port, host);
  });
}

async function isServiceAvailable(port, host = 'localhost', timeout = 1000) {
  const ipv4Ok = await checkPort(port, '127.0.0.1', timeout);
  if (ipv4Ok) return true;
  if (host !== '127.0.0.1') {
    const hostOk = await checkPort(port, host, timeout);
    if (hostOk) return true;
  }
  return false;
}

function getServiceTargets() {
  let postgresPort = 5433;
  let postgresHost = 'localhost';
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL.replace(/^postgresql:/, 'http:'));
      postgresPort = Number(url.port) || 5433;
      postgresHost = url.hostname || 'localhost';
    } catch {
      // fallback to defaults
    }
  }

  let redisPort = 6379;
  let redisHost = 'localhost';
  if (process.env.REDIS_URL) {
    try {
      const url = new URL(process.env.REDIS_URL.replace(/^redis:/, 'http:'));
      redisPort = Number(url.port) || 6379;
      redisHost = url.hostname || 'localhost';
    } catch {
      // fallback to defaults
    }
  }

  return { postgresPort, postgresHost, redisPort, redisHost };
}

function getStartupGuidance({ postgresUnavailable, redisUnavailable }) {
  if (postgresUnavailable && redisUnavailable) {
    return [
      `\n[ERROR] PostgreSQL and Redis are not running!`,
      `Docker Desktop may not be running or the containers are stopped.`,
      ``,
      `Steps to fix:`,
      `1. Open Docker Desktop.`,
      `2. Wait until Docker Engine is running.`,
      `3. Open a terminal in the project root.`,
      `4. Run: docker compose up -d postgres redis`,
      `5. Verify: docker compose ps`,
      `6. Restart the development server.\n`,
    ].join('\n');
  }

  if (postgresUnavailable) {
    return [
      `\n[ERROR] PostgreSQL is not running!`,
      `Docker Desktop may not be running or the PostgreSQL container is stopped.`,
      ``,
      `Steps to fix:`,
      `1. Open Docker Desktop.`,
      `2. Wait until Docker Engine is running.`,
      `3. Open a terminal in the project root.`,
      `4. Run: docker compose up -d postgres`,
      `5. Verify: docker compose ps`,
      `6. Restart the development server.\n`,
    ].join('\n');
  }

  if (redisUnavailable) {
    return [
      `\n[ERROR] Redis is not running!`,
      `Docker Desktop may not be running or the Redis container is stopped.`,
      ``,
      `Steps to fix:`,
      `1. Open Docker Desktop.`,
      `2. Wait until Docker Engine is running.`,
      `3. Open a terminal in the project root.`,
      `4. Run: docker compose up -d redis`,
      `5. Verify: docker compose ps`,
      `6. Restart the development server.\n`,
    ].join('\n');
  }

  return '';
}

async function runCheck() {
  const { postgresPort, postgresHost, redisPort, redisHost } = getServiceTargets();

  const [postgresOk, redisOk] = await Promise.all([
    isServiceAvailable(postgresPort, postgresHost),
    isServiceAvailable(redisPort, redisHost),
  ]);

  if (!postgresOk || !redisOk) {
    const guidance = getStartupGuidance({
      postgresUnavailable: !postgresOk,
      redisUnavailable: !redisOk,
    });
    console.error(guidance);
    process.exit(1);
  }

  console.log(`[HealthCheck] PostgreSQL (${postgresPort}) and Redis (${redisPort}) are reachable.`);
  process.exit(0);
}

runCheck();

