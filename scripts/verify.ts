import "dotenv/config";
import { buildApp } from "../src/app";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function runVerification() {
  console.log("🚀 Starting Verification...");

  // 1. Initialize DB (Push schema is automated via drizzle-kit usually, but here we assumme DB is empty or we run push)
  // For verification script, we can rely on `drizzle-kit push` having been run, or runtime migration.
  // We'll trust the user/system ran migration or we run it manually.

  const app = buildApp();

  try {
    // 2. Health Check
    console.log("Testing Health Check...");
    const health = await app.inject({ method: "GET", url: "/health" });
    if (health.statusCode === 200) console.log("✅ Health Check Passed");
    else console.error("❌ Health Check Failed", health.payload);

    // 3. Register User
    console.log("Testing Register...");
    const email = `test-${Date.now()}@example.com`;
    const register = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email,
        password: "password123",
        name: "Test User",
        role: "USER",
      },
    });

    if (register.statusCode === 201) console.log("✅ Register Passed");
    else console.error("❌ Register Failed", register.payload);

    const token = register.json().token;

    // 4. Register Admin
    console.log("Testing Register Admin...");
    const adminEmail = `admin-${Date.now()}@example.com`;
    const registerAdmin = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: adminEmail,
        password: "password123",
        name: "Admin User",
        role: "ADMIN",
      },
    });
    const adminToken = registerAdmin.json().token;

    // 5. Access Protected User Route (with token)
    console.log("Testing Protected Route (User)...");
    const profile = await app.inject({
      method: "GET",
      url: "/api/user/profile",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (profile.statusCode === 200)
      console.log("✅ Protected Route (User) Passed");
    else console.error("❌ Protected Route Failed", profile.payload);

    // 6. Access Admin Route (with User token) -> Should Fail
    console.log("Testing Admin Route (with User token)...");
    const adminFail = await app.inject({
      method: "GET",
      url: "/api/admin/dashboard",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (adminFail.statusCode === 403)
      console.log("✅ Admin Route Protection Passed");
    else
      console.error(
        "❌ Admin Route Protection Failed",
        adminFail.statusCode,
        adminFail.payload
      );

    // 7. Access Admin Route (with Admin token) -> Should Pass
    console.log("Testing Admin Route (with Admin token)...");
    const adminPass = await app.inject({
      method: "GET",
      url: "/api/admin/dashboard",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (adminPass.statusCode === 200) console.log("✅ Admin Access Passed");
    else
      console.error(
        "❌ Admin Access Failed",
        adminPass.statusCode,
        adminPass.payload
      );
  } catch (err) {
    console.error("❌ Verification Error", err);
    process.exit(1);
  } finally {
    // drizzle pool cleanup if needed
    process.exit(0); // force exit
  }
}

runVerification();
