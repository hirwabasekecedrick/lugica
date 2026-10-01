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
// The seed now creates driver1..driver3@lugica.com (develop PR #16). Override this
// to point at a different driver account, e.g. a hand-made local fixture.
const DRIVER_EMAIL = process.env.SEED_DRIVER_EMAIL || "driver1@lugica.com";
const CLIENT_EMAIL = process.env.SEED_CLIENT_EMAIL || "client1@lugica.com";

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

/**
 * Provision a fresh IN_TRANSIT delivery for the driver under test.
 *
 * The suite used to depend on the seeded delivery still being IN_TRANSIT, which
 * only held on a freshly seeded database — the first run consumed it and every
 * later run failed the ping section. Driving the real client -> admin assign ->
 * pickup -> transit chain instead makes the test repeatable and incidentally
 * covers those transitions.
 */
async function provisionActiveDelivery({ adminToken, driverId }) {
  const client = await (
    await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: CLIENT_EMAIL, password: PASSWORD }),
    })
  ).json();

  const created = await (
    await fetch(`${API}/deliveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${client.accessToken}` },
      body: JSON.stringify({
        pickupAddress: "KN 7 Rd, Kigali",
        pickupLat: -1.9701,
        pickupLng: 30.0875,
        dropoffAddress: "KG 5 St, Kigali",
        dropoffLat: -1.955,
        dropoffLng: 30.105,
        packageDetails: "tracking smoke test fixture",
      }),
    })
  ).json();

  if (!created?.id) throw new Error(`delivery create failed: ${JSON.stringify(created)}`);

  const vehicles = await (
    await fetch(`${API}/vehicles`, { headers: { Authorization: `Bearer ${adminToken}` } })
  ).json();
  const vehicle = (Array.isArray(vehicles) ? vehicles : []).find((v) => v.status === "AVAILABLE") ?? vehicles?.[0];
  if (!vehicle) throw new Error(`no vehicle available: ${JSON.stringify(vehicles)}`);

  const asAdmin = (method, path, body) =>
    fetch(`${API}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: body ? JSON.stringify(body) : undefined,
    }).then(async (res) => {
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(payload)}`);
      return payload;
    });

  await asAdmin("PATCH", `/deliveries/${created.id}/assign`, { driverId, vehicleId: vehicle.id });
  await asAdmin("PATCH", `/deliveries/${created.id}/pickup`);
  await asAdmin("PATCH", `/deliveries/${created.id}/transit`);

  // Re-read: the POST response is the pre-transition snapshot and still says
  // PENDING, so returning it would misreport the delivery's actual state.
  const finalState = await (
    await fetch(`${API}/deliveries/${created.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
  ).json();

  return { ...created, ...finalState };
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

const driver = await webLogin(DRIVER_EMAIL);
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
claims.email === DRIVER_EMAIL &&
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
  // Gap #23 is fixed: the global ThrottlerGuard no longer runs against WebSocket
  // handlers, so `tracking:start` reaches the service and replies `trackingState`.
  // This was previously asserted as a KNOWN BUG and is now required to pass.
  const started = await waitFor(driverSocket, "trackingState", 6000);
  check(
    "tracking:start registers the driver (gap #23 fixed)",
    started !== null && started.trackingStatus !== undefined,
    started ? `status=${started.trackingStatus}` : "no trackingState reply",
  );

  // Bind the ping to a delivery that is IN_TRANSIT so activeDeliveryId is set.
  const driverTokenApi = await (
    await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
body: JSON.stringify({ email: DRIVER_EMAIL, password: PASSWORD }),
    })
  ).json();

  // Reuse the seeded delivery when it is still in transit, otherwise provision
  // one, so the suite is repeatable on an already-mutated database.
  const adminTokenApi = await (
    await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@lugica.com", password: PASSWORD }),
    })
  ).json();

  const myDeliveries = await (
    await fetch(`${API}/deliveries`, {
      headers: { Authorization: `Bearer ${driverTokenApi.accessToken}` },
    })
  ).json();

  let activeDelivery = (Array.isArray(myDeliveries) ? myDeliveries : []).find(
    (d) => d.status === "IN_TRANSIT",
  );
  if (!activeDelivery) {
    activeDelivery = await provisionActiveDelivery({
      adminToken: adminTokenApi.accessToken,
      driverId: driverTokenApi.user?.id ?? claims.sub,
    });
  }
  check("driver has an IN_TRANSIT delivery for the ping", activeDelivery?.status === "IN_TRANSIT", `status=${activeDelivery?.status}`);

  if (activeDelivery) {
    const pushed = waitFor(adminSocket, "driversUpdate", 10000);

    driverSocket.emit("locationUpdate", {
      latitude: -1.9701,
      longitude: 30.0875,
      accuracy: 6,
      deliveryId: activeDelivery.id,
    });

    const update = await pushed;
const me = (update || []).find((d) => d.email === DRIVER_EMAIL);
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

  // 7. Distance accumulation and elapsed time.
  //
  // Delta-based rather than absolute: the Redis leg accumulator is seeded from
  // the last stored point for the delivery, so it may already be non-zero from
  // an earlier run of this script. What must hold is that *this* leg's
  // movement shows up, so assert on the difference across each ping.
  if (activeDelivery) {
    const auth = { Authorization: `Bearer ${driverTokenApi.accessToken}` };
    const summary = async () =>
      (await fetch(`${API}/tracking/deliveries/${activeDelivery.id}/summary`, { headers: auth })).json();

    const ping = async (latitude, longitude) => {
      // Sync on the admin-side push rather than a timeout: `locationUpdate`
      // does not reply `trackingState`, but it does always broadcast
      // `driversUpdate` once the ping has been persisted.
      const pushed = waitFor(adminSocket, "driversUpdate", 10000);
      driverSocket.emit("locationUpdate", { latitude, longitude, accuracy: 6, deliveryId: activeDelivery.id });
      return pushed;
    };

    // ~24.5 m of latitude: 0.00022 deg * ~111,320 m/deg. Paired with the 2 s
    // gap below this is ~12 m/s, inside the plausibility filter's 30 m/s cap.
    const before = await summary();
    check(
      "summary endpoint returns a numeric distance",
      typeof before.distanceMeters === "number",
      `distanceMeters=${before.distanceMeters}`,
    );

    await ping(-1.9701, 30.0875);
    await new Promise((r) => setTimeout(r, 2000));
    await ping(-1.96988, 30.0875);

    const moved = await summary();
    const gained = moved.distanceMeters - before.distanceMeters;
    check(
      "moving ~24 m north increases the accumulated distance",
      gained > 15 && gained < 35,
      `gained=${gained?.toFixed(1)}m (total ${moved.distanceMeters?.toFixed(1)}m, ${moved.pointCount} points)`,
    );

    // A driver stopped at a light still reports a position every 3 s. Identical
    // coordinates must contribute exactly nothing, or the total inflates on its own.
    await new Promise((r) => setTimeout(r, 2000));
    await ping(-1.96988, 30.0875);
    const parked = await summary();
    check(
      "a repeated fix does not inflate the distance",
      Math.abs(parked.distanceMeters - moved.distanceMeters) < 1,
      `${moved.distanceMeters?.toFixed(1)}m -> ${parked.distanceMeters?.toFixed(1)}m`,
    );
    check(
      "elapsed time is derived and non-negative",
      typeof parked.elapsedSeconds === "number" && parked.elapsedSeconds >= 0,
      `elapsedSeconds=${parked.elapsedSeconds} since ${parked.pickedUpAt ?? "not picked up yet"}`,
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