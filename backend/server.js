// TechShelf back-end API (Milestone 2)
// Runs on the BE VM at 10.0.0.20:4000. Only the FE VM should reach it.
const express = require("express");
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const app = express();

// Connection pool to MySQL on the DB VM. Settings come from the .env file,
// so the database password is never written in the code or in GitHub.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

// Log every request with a timestamp. The body is never logged, so passwords stay out of the logs.
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.originalUrl} -> ${res.statusCode}`);
  });
  next();
});

// Read JSON request bodies (comes after the logger so every request is logged)
app.use(express.json());

// Password hashing with Node's built-in crypto module (scrypt).
// A random salt makes two identical passwords produce different hashes.
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  const hash = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex"));
}

// Server-side validation rules
const USERNAME_RE = /^[a-zA-Z0-9_]{3,50}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Sessions ----------
// After login the server creates a random session ID, saves it in the sessions table,
// and gives it to the browser in a cookie. Each later request sends the cookie back,
// and the server looks the ID up to know who is logged in.
const SESSION_HOURS = 8;

function getSessionId(req) {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/(?:^|;\s*)sid=([a-f0-9]{64})/);
  return match ? match[1] : null;
}

// Middleware: only lets the request through if the session cookie is valid
async function requireLogin(req, res, next) {
  const sid = getSessionId(req);
  if (!sid) return res.status(401).json({ error: "Please log in." });
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.full_name, u.role
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > NOW()`,
      [sid]
    );
    if (!rows[0]) return res.status(401).json({ error: "Session expired. Please log in again." });
    req.user = rows[0]; // the logged-in user, available to every route after this
    next();
  } catch (err) {
    console.error(err.code, err.message);
    res.status(500).json({ error: "Server error." });
  }
}

app.post("/api/register", async (req, res) => {
  const { fullname, email, username, password } = req.body || {};

  if (typeof fullname !== "string" || !fullname.trim() || fullname.length > 100)
    return res.status(400).json({ error: "Full name is required (max 100 characters)." });
  if (typeof email !== "string" || !EMAIL_RE.test(email) || email.length > 255)
    return res.status(400).json({ error: "Enter a valid email address." });
  if (typeof username !== "string" || !USERNAME_RE.test(username))
    return res.status(400).json({ error: "Username must be 3-50 letters, numbers or underscores." });
  if (typeof password !== "string" || password.length < 8)
    return res.status(400).json({ error: "Password must be at least 8 characters." });

  try {
    const passwordHash = await hashPassword(password);
    // Parameterized query: the ? placeholders keep user input as data, never as SQL (blocks SQL injection)
    await pool.execute(
      "INSERT INTO users (full_name, email, username, password_hash) VALUES (?, ?, ?, ?)",
      [fullname.trim(), email.toLowerCase(), username, passwordHash]
    );
    res.status(201).json({ message: "Account created." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "That email or username is already taken." });
    console.error(err.code, err.message);
    res.status(500).json({ error: "Server error." });
  }
});

app.post("/api/login", async (req, res) => {
  const { identifier, password } = req.body || {};

  if (typeof identifier !== "string" || typeof password !== "string" || !identifier || !password)
    return res.status(400).json({ error: "Username/email and password are required." });

  try {
    const [rows] = await pool.execute(
      "SELECT id, username, role, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1",
      [identifier, identifier.toLowerCase()]
    );
    const user = rows[0];
    // Same message whether the user doesn't exist or the password is wrong,
    // so an attacker can't tell which usernames exist.
    if (!user || !(await verifyPassword(password, user.password_hash)))
      return res.status(401).json({ error: "Invalid username/email or password." });

    const sid = crypto.randomBytes(32).toString("hex"); // 64 random hex characters
    await pool.execute(
      `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, NOW() + INTERVAL ${SESSION_HOURS} HOUR)`,
      [sid, user.id]
    );
    // HttpOnly: page scripts can't read the cookie. SameSite=Strict: other sites can't send it.
    res.setHeader("Set-Cookie", `sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}`);
    res.json({ message: "Login successful.", user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error(err.code, err.message);
    res.status(500).json({ error: "Server error." });
  }
});

// Who is logged in?
app.get("/api/me", requireLogin, (req, res) => {
  res.json({ user: req.user });
});

// Log out: delete the session so the cookie stops working
app.post("/api/logout", async (req, res) => {
  const sid = getSessionId(req);
  try {
    if (sid) await pool.execute("DELETE FROM sessions WHERE id = ?", [sid]);
    res.setHeader("Set-Cookie", "sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
    res.json({ message: "Logged out." });
  } catch (err) {
    console.error(err.code, err.message);
    res.status(500).json({ error: "Server error." });
  }
});

app.use((req, res) => res.status(404).json({ error: "Not found." }));

// Error handler: return a short JSON error instead of a stack trace,
// and never log the request body (it could contain a password).
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ error: "Invalid JSON." });
  console.error(err.message);
  res.status(500).json({ error: "Server error." });
});

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "10.0.0.20";
app.listen(PORT, HOST, (err) => {
  // Express 5 passes startup errors here. If the address isn't ready yet (e.g. during boot),
  // exit with an error code so systemd restarts the service a few seconds later.
  if (err) {
    console.error(`Could not listen on ${HOST}:${PORT}: ${err.code}`);
    process.exit(1);
  }
  console.log(`TechShelf API running on http://${HOST}:${PORT}`);
});