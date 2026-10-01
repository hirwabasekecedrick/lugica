/**
 * Renders the real pages through the running dev/prod web server and asserts the
 * server-side gates behave: /driver is DRIVER-only, /admin/tracking is
 * ADMIN-only, and anonymous visitors are redirected to /login.
 *
 * Checks status codes and the presence of the page's own copy, so a 200 that
 * renders somebody else's page would not pass.
 */
const WEB = process.env.WEB_ORIGIN || "http://localhost:3000";
const PASSWORD = process.env.SEED_PASSWORD || "Admin@123";

function jar() {
  let cookie = "";
  return {
    absorb(res) {
      for (const line of res.headers.getSetCookie?.() ?? []) {
        const pair = line.split(";")[0];
        if (pair) cookie = cookie ? `${cookie}; ${pair}` : pair;
      }
    },
    header: () => (cookie ? { Cookie: cookie } : {}),
  };
}

async function loginAs(email) {
  const c = jar();
  const res = await fetch(`${WEB}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
    redirect: "manual",
  });
  c.absorb(res);
  return c;
}

async function get(path, cookies) {
  const res = await fetch(`${WEB}${path}`, {
    headers: cookies ? cookies.header() : {},
    redirect: "manual",
  });
  return { status: res.status, location: res.headers.get("location"), body: await res.text() };
}

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

(async () => {
  // 1. Anonymous hits are redirected by proxy.ts, never rendered.
  for (const path of ["/driver", "/admin/tracking"]) {
    const res = await get(path);
    check(
      `anonymous ${path} redirects to /login`,
      res.status >= 300 && res.status < 400 && (res.location ?? "").includes("/login"),
      `${res.status} -> ${res.location}`,
    );
  }

  const driver = await loginAs("driver1@gmail.com");
  const admin = await loginAs("admin@lugica.com");
  const client = await loginAs("client1@lugica.com");

  // 2. /driver for a driver renders the driver shell.
  //    NOTE: the delivery lists come from TanStack Query on the client, so the
  //    server HTML legitimately shows the loading state. Assert on the shell
  //    and the role-specific chrome, not on client-fetched copy.
  const asDriver = await get("/driver", driver);
  check("driver can load /driver", asDriver.status === 200, `status ${asDriver.status}`);
  check(
    "/driver renders the driver shell",
    asDriver.body.includes("My Deliveries") &&
      asDriver.body.includes("Go online") &&
      asDriver.body.includes("Delivery"),
    "title + online toggle + section headings present",
  );
  check(
    "/driver is not the admin shell",
    !asDriver.body.includes("Live Tracking"),
    "admin tracking nav absent for a driver",
  );

  // 3. /driver is closed to other roles.
  const driverAsAdmin = await get("/driver", admin);
  check(
    "admin is refused /driver (redirects to /403)",
    driverAsAdmin.status >= 300 &&
      driverAsAdmin.status < 400 &&
      (driverAsAdmin.location ?? "").includes("/403"),
    `${driverAsAdmin.status} -> ${driverAsAdmin.location}`,
  );

  const driverAsClient = await get("/driver", client);
  check(
    "client is refused /driver",
    driverAsClient.status >= 300 &&
      driverAsClient.status < 400 &&
      (driverAsClient.location ?? "").includes("/403"),
    `${driverAsClient.status} -> ${driverAsClient.location}`,
  );

  // 4. /admin/tracking for an admin.
  //    This page must NOT 500: it is the route that proved the Leaflet import
  //    was reaching the server render (see markers.ts / markerIcon.ts split).
  const asAdmin = await get("/admin/tracking", admin);
  check(
    "admin can load /admin/tracking without an SSR crash",
    asAdmin.status === 200,
    `status ${asAdmin.status}`,
  );
  check(
    "/admin/tracking renders the live tracking chrome",
    asAdmin.body.includes("Live Tracking") && asAdmin.body.includes("Administration"),
    "sidebar entry + admin frame present",
  );
  check(
    "/admin/tracking did not evaluate Leaflet on the server",
    !asAdmin.body.includes("window is not defined"),
    "no Leaflet SSR reference error",
  );

  const trackingAsDriver = await get("/admin/tracking", driver);
  check(
    "driver is refused /admin/tracking",
    trackingAsDriver.status >= 300 &&
      trackingAsDriver.status < 400 &&
      (trackingAsDriver.location ?? "").includes("/403"),
    `${trackingAsDriver.status} -> ${trackingAsDriver.location}`,
  );

  // 5. Leaflet must never be imported on the server: a crash here means the
  //    ssr:false boundary is not working.
  check(
    "server render of /driver did not crash on Leaflet",
    !asDriver.body.includes("window is not defined") &&
      !asDriver.body.includes("ReferenceError"),
    "no SSR reference errors in the payload",
  );

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("FAILED: " + failed.map((f) => f.name).join("; "));
  }
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error("crashed:", e);
  process.exit(1);
});