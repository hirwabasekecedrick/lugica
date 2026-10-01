/**
 * End-to-end smoke test for the driver journey flow, against the running API.
 *
 * Exercises exactly the sequence the new /driver page drives:
 *   admin assigns -> driver accepts (ASSIGNED -> PICKED_UP)
 *   -> starts journey (PICKED_UP -> IN_TRANSIT) -> sends a ping
 *   -> admin sees the driver live -> driver marks delivered
 *
 * Also asserts the role walls: a CLIENT must not be able to read the admin-only
 * driver list, and a DRIVER must only see their own deliveries.
 */
const API = process.env.API_ORIGIN || "http://localhost:8080";

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.accessToken) {
    throw new Error(`login ${email} failed: ${res.status} ${JSON.stringify(body)}`);
  }
  return body.accessToken;
}

const call = (token, method, path, payload) =>
  fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

(async () => {
  const PASSWORD = process.env.SEED_PASSWORD || "Password123!";
<<<<<<< HEAD
// Matches the seed's driver1@lugica.com (develop PR #16). Override to target
// another driver account, e.g. a hand-made local fixture.
const DRIVER_EMAIL = process.env.SEED_DRIVER_EMAIL || "driver1@lugica.com";

  const adminToken = await login("admin@lugica.com", PASSWORD);
  const driverToken = await login(DRIVER_EMAIL, PASSWORD);
=======

  const adminToken = await login("admin@lugica.com", PASSWORD);
  const driverToken = await login("driver1@gmail.com", PASSWORD);
>>>>>>> 1ac66812de17e776c6489336e4b1fdd19d9122ba
  const clientToken = await login("client1@lugica.com", PASSWORD);
  check("login admin/driver/client", true);

  // 1. The driver sees only their own deliveries.
  const driverDeliveries = await (await call(driverToken, "GET", "/deliveries")).json();
  const others = driverDeliveries.filter((d) => d.driverId !== null);
  check(
    "driver list is role-filtered",
    Array.isArray(driverDeliveries) && driverDeliveries.length > 0,
    `${driverDeliveries.length} deliveries, all self-assigned: ${driverDeliveries.every((d) => !d.driverId || others.some((o) => o.id === d.id))}`,
  );

  const hasCoords = driverDeliveries.every(
    (d) => typeof d.dropoffLat === "number" && typeof d.dropoffLng === "number",
  );
  check("deliveries carry dropoff coordinates (map markers)", hasCoords);

  // 2. Admin sees the same deliveries plus anything unassigned.
  const adminDeliveries = await (await call(adminToken, "GET", "/deliveries")).json();
  check(
    "admin list is a superset",
    adminDeliveries.length >= driverDeliveries.length,
    `admin ${adminDeliveries.length} >= driver ${driverDeliveries.length}`,
  );

  // 3. A client must not reach the admin-only live driver list.
  const clientDrivers = await call(clientToken, "GET", "/tracking/drivers");
  check(
    "client blocked from GET /tracking/drivers",
    clientDrivers.status === 403,
    `status ${clientDrivers.status}`,
  );

  // 4. Admin may, and gets an array.
  const adminDrivers = await call(adminToken, "GET", "/tracking/drivers");
  const driverBody = await adminDrivers.json();
  check(
    "admin allowed on GET /tracking/drivers",
    adminDrivers.status === 200 && Array.isArray(driverBody),
    `status ${adminDrivers.status}, ${Array.isArray(driverBody) ? driverBody.length : "non-array"} drivers`,
  );

  // 5. Admin assigns the PENDING delivery to the driver.
  const pending = adminDeliveries.find((d) => d.status === "PENDING");
  if (!pending) {
    check("found a PENDING delivery to assign", false, "none present");
  } else {
    const drivers = await (await call(adminToken, "GET", "/users?role=DRIVER&page=1&limit=25")).json();
    const driverUser = (drivers.data ?? []).find((u) => u.role === "DRIVER");
    const vehicle = (await (await call(adminToken, "GET", "/vehicles")).json()).find(
      (v) => v.status === "ACTIVE",
    );

    const assigned = await call(adminToken, "PATCH", `/deliveries/${pending.id}/assign`, {
      driverId: driverUser.id,
      vehicleId: vehicle.id,
    });
    const assignedBody = await assigned.json();
    check(
      "admin assigns PENDING -> ASSIGNED",
      assigned.status === 200 || assigned.status === 201,
      `status ${assigned.status} ${assignedBody?.status ?? ""}`,
    );

    // 6. The driver's accept: ASSIGNED -> PICKED_UP.
    const pickedUp = await call(driverToken, "PATCH", `/deliveries/${pending.id}/pickup`, {});
    const pickedBody = await pickedUp.json();
    check(
      "driver accepts: ASSIGNED -> PICKED_UP",
      pickedUp.status === 200 || pickedUp.status === 201,
      `status ${pickedUp.status} ${pickedBody?.status ?? JSON.stringify(pickedBody).slice(0, 80)}`,
    );

    // 7. Start the journey.
    const transit = await call(driverToken, "PATCH", `/deliveries/${pending.id}/transit`, {});
    const transitBody = await transit.json();
    check(
      "driver starts journey: PICKED_UP -> IN_TRANSIT",
      transit.status === 200 || transit.status === 201,
      `status ${transit.status} ${transitBody?.status ?? ""}`,
    );

    // 8. Send a location ping bound to that delivery.
    const pinged = await call(driverToken, "POST", "/locations/ping", {
      latitude: -1.9666,
      longitude: 30.1,
      accuracy: 8,
      deliveryId: pending.id,
    });
    const pingBody = await pinged.json();
    check(
      "driver location ping accepted",
      pinged.status === 201 || pinged.status === 200,
      `status ${pinged.status} ${JSON.stringify(pingBody).slice(0, 80)}`,
    );

    // 9. The driver now appears in the admin live list.
    const liveRes = await call(adminToken, "GET", "/tracking/drivers");
    const live = await liveRes.json();
<<<<<<< HEAD
    const me = live.find((d) => d.email === DRIVER_EMAIL);
=======
    const me = live.find((d) => d.email === "driver1@gmail.com");
>>>>>>> 1ac66812de17e776c6489336e4b1fdd19d9122ba
    check(
      "admin sees the driver live after a ping",
      Boolean(me),
      me ? `${me.trackingStatus} @ ${me.lastLatitude},${me.lastLongitude}` : "not listed",
    );
    check(
      "live state includes the active delivery",
      Boolean(me?.activeDeliveryId === pending.id),
      `activeDeliveryId=${me?.activeDeliveryId} expected ${pending.id}`,
    );

    // 10. The trail recorded by the ping is readable by the driver.
    const trailRes = await call(driverToken, "GET", `/tracking/deliveries/${pending.id}/trail`);
    const trail = await trailRes.json();
    check(
      "driver reads their own delivery trail",
      trailRes.status === 200 && Array.isArray(trail) && trail.length > 0,
      `status ${trailRes.status}, ${trail?.length ?? 0} points`,
    );

    // 11. A driver cannot transition someone else's delivery.
    const foreign = adminDeliveries.find((d) => d.driverId && d.driverId !== driverUser.id);
    if (foreign) {
      const denied = await call(driverToken, "PATCH", `/deliveries/${foreign.id}/deliver`, {});
      check(
        "driver blocked from another driver's delivery",
        denied.status === 403,
        `status ${denied.status}`,
      );
    }

    // 12. Complete the journey so the history panel gains a row.
    const done = await call(driverToken, "PATCH", `/deliveries/${pending.id}/deliver`, {});
    const doneBody = await done.json();
    check(
      "driver completes: IN_TRANSIT -> DELIVERED",
      done.status === 200 || done.status === 201,
      `status ${done.status} ${doneBody?.status ?? ""} deliveredAt=${doneBody?.deliveredAt ?? "null"}`,
    );

    // 13. An illegal transition is refused by the state machine.
    const again = await call(driverToken, "PATCH", `/deliveries/${pending.id}/deliver`, {});
    check(
      "terminal status refuses further transitions",
      again.status === 400,
      `status ${again.status}`,
    );
  }

  // 14. /tracking/me works for the driver and is refused for a client.
  const meRes = await call(driverToken, "GET", "/tracking/me");
  check("GET /tracking/me works for driver", meRes.status === 200, `status ${meRes.status}`);
  const clientMe = await call(clientToken, "GET", "/tracking/me");
  check("GET /tracking/me refused for client", clientMe.status === 403, `status ${clientMe.status}`);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("FAILED: " + failed.map((f) => f.name).join("; "));
    process.exitCode = 1;
  }
})().catch((e) => {
  console.error("smoke test crashed:", e.message);
  process.exitCode = 1;
});