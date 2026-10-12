// TechShelf front-end server (Milestone 1)
// Serves the static Home, Login and Register pages from ./public
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0"; // listen on all interfaces so other machines can reach the VM

// Request log with timestamp (start of the Logging/Monitoring deliverable)
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.originalUrl} -> ${res.statusCode}`);
  });
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "public", "register.html")));

app.use((req, res) => res.status(404).send("404 - Page not found"));

app.listen(PORT, HOST, () => {
  console.log(`TechShelf front-end running on http://${HOST}:${PORT}`);
});
