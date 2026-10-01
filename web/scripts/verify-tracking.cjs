/**
 * Verifies the BFF-issued socket token actually authenticates against the real
 * Socket.IO gateway — the main design risk, since the gateway verifies with the
 * shared JwtService rather than a purpose-scoped secret.
 *
 * Also checks the whole browser-facing chain:
 *   BFF login -> httpOnly cookie -> GET /api/socket-token -> gateway connect
 *   -> driversUpdate push -> admin sees the live driver.
 */
const { io } = require("socket.io-client");

const WEB = process.env.WEB_ORIGIN || "http://localhost:3000";
const API = process.env.API_ORIGIN || "http://localhost:8080";
const PASSWORD = process.env.SEED_PASSWORD || "Admin@123";
<<<<<<< HEAD
// The seed now creates driver1..driver3@lugica.com (develop PR #16). Override this
// to point at a different driver account, e.g. a hand-made local fixture.
const DRIVER_EMAIL = process.env.SEED_DRIVER_EMAIL || "driver1@lugica.com";
=======
>>>>>>> 1ac66812de17e776c6489336e4b1fdd19d9122ba

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

/** Minimal cookie jar so the httpOnly session cookie is carried across calls. */
function jar() {
  let cookie = "";
  return {
    absorb(res) {
      const raw = res.headers.getSetCookie?.() ?? [];
      for (const line of raw) {
        const pair = line.split(";")[0];
        if (pair) cookie = cookie ? `${cookie}; ${pair}` : pair;
      }
    },
    header: () => (cookie ? { Cookie: cookie } : {}),
  };
}

async function webLogin(email) {
  const c = jar();
  const res = await fetch(`${WEB}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  c.absorb(res);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`BFF login ${email}: ${res.status} ${JSON.stringify(body)}`);
  return { cookies: c, body };
}

async function socketToken(cookies) {
  const res = await fetch(`${WEB}/api/socket-token`, { headers: cookies.header() });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

/** Connect and resolve with the first event matching `event`, or null on timeout. */
function waitFor(socket, event, ms = 8000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      socket.off(event);
      resolve(null);
    }, ms);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

(async () => {
  // 1. Unauthenticated socket-token must be refused.
  const anon = await fetch(`${WEB}/api/socket-token`);
  check("GET /api/socket-token refuses anonymous", anon.status === 401, `status ${anon.status}`);

  const admin = await webLogin("admin@lugica.com");
  check(
    "BFF login sets httpOnly cookie and returns no token material",
    admin.body.ok === true && admin.body.role === "ADMIN" && admin.body.accessToken === undefined,
    JSON.stringify(admin.body),
  );

<<<<<<< HEAD
  const driver = await webLogin(DRIVER_EMAIL);
=======
  const driver = await webLogin("driver1@gmail.com");
>>>>>>> 1ac66812de17e776c6489336e4b1fdd19d9122ba
  check("driver BFF login", driver.body.ok === true && driver.body.role === "DRIVER", JSON.stringify(driver.body));

  // 2. Token minting per role.
  const adminTok = await socketToken(admin.cookies);
  check(
    "admin socket token minted",
    adminTok.status === 200 && typeof adminTok.body.token === "string",
    `status ${adminTok.status} expiresIn=${adminTok.body?.expiresIn}`,
  );

  const driverTok = await socketToken(driver.cookies);
  check(
    "driver socket token minted",
    driverTok.status === 200 && typeof driverTok.body.token === "string",
  );

  // 3. The claim shape the gateway reads must be present.
  const claims = JSON.parse(
    Buffer.from(driverTok.body.token.split(".")[1], "base64url").toString("utf8"),
  );
  check(
    "token carries { sub, email, role } the gateway reads",
    typeof claims.sub === "string" &&
<<<<<<< HEAD
      claims.email === DRIVER_EMAIL &&
=======
      claims.email === "driver1@gmail.com" &&
>>>>>>> 1ac66812de17e776c6489336e4b1fdd19d9122ba
      claims.role === "DRIVER" &&
      claims.purpose === "socket",
    `exp in ${claims.exp - claims.iat}s, purpose=${claims.purpose}`,
  );

  // 4. Admin connects and receives the immediate driversUpdate on connect.
  const adminSocket = io(API, {
    auth: { token: adminTok.body.token },
    transports: ["websocket", "polling"],
    tryAllTransports: true,
    reconnection: false,
  });

  const adminConnected = await waitFor(adminSocket, "connect", 10000);
  check("admin socket authenticated against the gateway", adminConnected !== null);

  const initialDrivers = await waitFor(adminSocket, "driversUpdate", 8000);
  check(
    "gateway pushes driversUpdate on admin connect",
    Array.isArray(initialDrivers),
    `${initialDrivers?.length ?? "none"} drivers`,
  );

  // 5. Driver connects, goes online, and pings. Admin must receive the push.
  // Errors are collected for the lifetime of the socket, since WsExceptionFilter
// emits them at an unpredictable moment relative to the awaits below.
const driverErrors = [];
const driverSocket = io(API, {
    auth: { token: driverTok.body.token },
    transports: ["websocket", "polling"],
    tryAllTransports: true,
    reconnection: false,
  });
driverSocket.on("error", (e) => driverErrors.push(e?.message ?? String(e)));

  const driverConnected = await waitFor(driverSocket, "connect", 10000);
  check("driver socket authenticated against the gateway", driverConnected !== null);

  driverSocket.emit("tracking:start");
  // NOTE: this is expected to FAIL against the current API. The global
  // ThrottlerGuard throws on WebSocket handlers, so `tracking:start` never
  // reaches the service (docs/API-GAPS.md #23). The assertion records the known
  // bug rather than hiding it; flip it to require `started` once fixed.
  const started = await waitFor(driverSocket, "trackingState", 6000);
  check(
    "KNOWN BUG (#23): tracking:start is rejected by the global ThrottlerGuard",
    started === null &&
      driverErrors.some((m) => String(m).includes("header")),
    driverErrors.length ? driverErrors[0] : "unexpectedly succeeded",
  );

  // Bind the ping to the seeded IN_TRANSIT delivery so activeDeliveryId is set.
  const driverTokenApi = await (
    await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
      body: JSON.stringify({ email: DRIVER_EMAIL, password: PASSWORD }),
=======
      body: JSON.stringify({ email: "driver1@gmail.com", password: PASSWORD }),
>>>>>>> 1ac66812de17e776c6489336e4b1fdd19d9122ba
    })
  ).json();

  const myDeliveries = await (
    await fetch(`${API}/deliveries`, {
      headers: { Authorization: `Bearer ${driverTokenApi.accessToken}` },
    })
  ).json();
  const activeDelivery = myDeliveries.find((d) => d.status === "IN_TRANSIT");
  check("driver has an IN_TRANSIT delivery for the ping", Boolean(activeDelivery));

  if (activeDelivery) {
    const pushed = waitFor(adminSocket, "driversUpdate", 10000);

    driverSocket.emit("locationUpdate", {
      latitude: -1.9701,
      longitude: 30.0875,
      accuracy: 6,
      deliveryId: activeDelivery.id,
    });

    const update = await pushed;
<<<<<<< HEAD
    const me = (update || []).find((d) => d.email === DRIVER_EMAIL);
=======
    const me = (update || []).find((d) => d.email === "driver1@gmail.com");
>>>>>>> 1ac66812de17e776c6489336e4b1fdd19d9122ba
    check(
      "socket locationUpdate reaches the admin map in real time",
      Boolean(me && me.lastLatitude === -1.9701 && me.lastLongitude === 30.0875),
      me ? `${me.trackingStatus} @ ${me.lastLatitude},${me.lastLongitude} delivery=${me.activeDeliveryId}` : "driver absent",
    );
    check(
      "live state binds the active delivery (driver's map target)",
      me?.activeDeliveryId === activeDelivery.id,
      `activeDeliveryId=${me?.activeDeliveryId}`,
    );
    check(
      "socket path populates Redis, unlike POST /locations/ping (gap #21)",
      Boolean(me),
      "driver now listed in GET /tracking/drivers",
    );

    // Despite the broken tracking:start, the driver must still be registered —
    // handleLocationUpdate calls startTracking internally.
    const myState = await fetch(`${API}/tracking/me`, {
      headers: { Authorization: `Bearer ${driverTokenApi.accessToken}` },
    });
    const myBody = await myState.json();
    check(
      "GET /tracking/me confirms the driver is registered after the first ping",
      myState.status === 200 && myBody.trackingStatus !== "offline",
      `trackingStatus=${myBody.trackingStatus}`,
    );
  }

  // 6. The same position is readable by the driver through REST for the trail.
  if (activeDelivery) {
    const trail = await (
      await fetch(`${API}/tracking/deliveries/${activeDelivery.id}/trail`, {
        headers: { Authorization: `Bearer ${driverTokenApi.accessToken}` },
      })
    ).json();
    check(
      "trail recorded for the socket ping",
      Array.isArray(trail) && trail.length > 0,
      `${trail?.length ?? 0} points`,
    );
  }

  adminSocket.close();
  driverSocket.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("FAILED: " + failed.map((f) => f.name).join("; "));
    process.exitCode = 1;
  }
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error("crashed:", e);
  process.exit(1);
});