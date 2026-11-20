// TechShelf: login, register, logout, and the "who is logged in?" check on protected pages.
(function () {
  // ----- Protected pages (home page) -----
  // Ask the server who is logged in. No valid session -> go to the login page.
  const welcome = document.getElementById("welcome-user");
  if (welcome) {
    fetch("/api/me")
      .then((res) => {
        if (res.status === 401) {
          window.location.replace("login.html");
          return null;
        }
        return res.json();
      })
      .then((body) => {
        if (body && body.user) welcome.textContent = `Welcome, ${body.user.username} (${body.user.role})`;
      })
      .catch(() => {
        welcome.textContent = "Can't reach the server";
      });
  }

  // ----- Log out button -----
  const logout = document.getElementById("logout-link");
  if (logout) {
    logout.addEventListener("click", async (event) => {
      event.preventDefault();
      await fetch("/api/logout", { method: "POST" }).catch(() => {});
      window.location.replace("login.html");
    });
  }

  // ----- Login and Register forms -----
  const form = document.querySelector("form[data-api]");
  if (!form) return;

  const action = form.dataset.api; // "login" or "register"
  const message = document.getElementById("form-message");
  const button = form.querySelector('button[type="submit"]');

  function show(text, ok) {
    message.textContent = text;
    message.className = "form-message " + (ok ? "ok" : "error");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // stop the browser's normal form submit; we send it with fetch instead

    const data = Object.fromEntries(new FormData(form));

    if (action === "register" && data.password !== data.confirm) {
      show("Passwords do not match.", false);
      return;
    }
    delete data.confirm;  // the server doesn't need these two fields
    delete data.remember;

    button.disabled = true;
    try {
      const res = await fetch("/api/" + action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        show(body.error || "Something went wrong. Try again.", false);
        return;
      }

      if (action === "register") {
        show("Account created. Taking you to log in...", true);
        form.reset();
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } else {
        // The session cookie was set by the server; the browser stores it automatically.
        show("Login successful. Redirecting...", true);
        setTimeout(() => (window.location.href = "index.html"), 1000);
      }
    } catch {
      show("Can't reach the server. Check your connection and try again.", false);
    } finally {
      button.disabled = false;
    }
  });
})();