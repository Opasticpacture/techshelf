// TechShelf: device search page. Asks the API for devices and shows them in the table.
(function () {
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  const typeSelect = document.getElementById("type-select");
  const rows = document.getElementById("device-rows");
  const status = document.getElementById("search-status");

  // Coming from the home page search bar (devices.html?q=dell)? Start with that text.
  input.value = new URLSearchParams(window.location.search).get("q") || "";

  async function search() {
    const query = new URLSearchParams({ search: input.value, type: typeSelect.value });
    status.textContent = "Searching...";
    try {
      const res = await fetch("/api/devices?" + query);
      if (res.status === 401) {
        window.location.replace("login.html");
        return;
      }
      const body = await res.json();
      if (!res.ok) {
        status.textContent = body.error || "Search failed.";
        return;
      }
      show(body.devices);
    } catch {
      status.textContent = "Can't reach the server.";
    }
  }

  function show(devices) {
    rows.textContent = ""; // clear old results
    status.textContent = devices.length + (devices.length === 1 ? " device found" : " devices found");

    for (const d of devices) {
      const row = document.createElement("tr");
      for (const value of [d.name, d.type, d.serial_number]) {
        const cell = document.createElement("td");
        cell.textContent = value; // textContent (not innerHTML), so text from the database can't run as code
        row.appendChild(cell);
      }
      const statusCell = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "badge " + d.status.toLowerCase().replace(" ", "-"); // e.g. "badge checked-out"
      badge.textContent = d.mine ? d.status + " (you)" : d.status;
      statusCell.appendChild(badge);
      row.appendChild(statusCell);
      rows.appendChild(row);
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    search();
  });
  typeSelect.addEventListener("change", search);

  search(); // show all devices when the page opens
})();