// TechShelf front-end server
// Serves the pages in ./public and forwards /api requests (with the session cookie) to the
// back end on the internal network. The browser never talks to the back end directly.
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0"; // listen on all interfaces so other machines can reach the FE
const BACKEND_URL = process.env.BACKEND_URL || "http://10.0.0.20:4000"; // BE VM on the internal network

// Request log with timestamp. The body is never logged, so passwords stay out of the logs.
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.originalUrl} -> ${res.statusCode}`);
  });
  next();
});

// Read JSON request bodies (small size limit so nobody can send huge requests)
app.use(express.json({ limit: "10kb" }));

app.use(express.static(path.join(__dirname, "public")));

app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "public", "register.html")));

// Forward every /api request to the back end, including the session cookie.
// The back end decides what exists and who is allowed (it checks the session on every protected route).
app.use("/api", async (req, res) => {
  const options = {
    method: req.method,
    headers: {},
    signal: AbortSignal.timeout(5000), // give up after 5 seconds if the back end doesn't answer
  };
  if (req.headers.cookie) options.headers.cookie = req.headers.cookie; // pass the session cookie along
  if (req.method !== "GET" && req.method !== "HEAD") {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(req.body ?? {});
  }

  try {
    const backendRes = await fetch(BACKEND_URL + req.originalUrl, options);
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) res.setHeader("Set-Cookie", setCookie); // pass the login/logout cookie back to the browser
    const data = await backendRes.json().catch(() => ({ error: "Bad response from server." }));
    res.status(backendRes.status).json(data);
  } catch (err) {
    console.error("Back end unreachable:", err.cause?.code || err.name);
    res.status(502).json({ error: "Service unavailable. Try again later." });
  }
});

app.use((req, res) => res.status(404).send("404 - Page not found"));

// Error handler: short JSON error instead of a stack trace
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request too large." });
  console.error(err.message);
  res.status(500).json({ error: "Server error." });
});

app.listen(PORT, HOST, () => {
  console.log(`TechShelf front-end running on http://${HOST}:${PORT}`);
});