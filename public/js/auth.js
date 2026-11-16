// TechShelf: sends the Login and Register forms to the API and shows the result on the page.
(function () {
  // Home page: show the logged-in username in the navbar (display only, not real security)
  const welcome = document.getElementById("welcome-user");
  if (welcome) {
    const name = sessionStorage.getItem("techshelfUser");
    if (name) welcome.textContent = "Welcome, " + name;
  }

  const form = document.querySelector("form[data-api]");
  if (!form) return;

  const action = form.dataset.api; // "login" or "register"
  const message = document.getElementById("form-message");
  const button = form.querySelector('button[type="submit"]');

  // Opening the login page counts as logging out
  if (action === "login") sessionStorage.removeItem("techshelfUser");

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
        sessionStorage.setItem("techshelfUser", body.user.username);
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