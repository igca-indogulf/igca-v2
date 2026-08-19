/* ==========================================================================
   IGCA — Discover
   Live Supabase search, dynamic filters and recommendations
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  App.mountShell("discover.html");

  const peoplePane = document.getElementById("tab-people");
  const companyPane = document.getElementById("tab-companies");
  const oppPane = document.getElementById("tab-opportunities");
  const searchInput = document.getElementById("discover-search");

  let profiles = [];
  let activeFilters = {
    location: [],
    account_type: [],
    industry: [],
    verified: false
  };

  /* ---------------------------------------------------------
     LOAD LIVE PROFILES
  --------------------------------------------------------- */

  async function loadProfiles() {
  peoplePane.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1;">
      <h3>Loading people...</h3>
      <p>Please wait.</p>
    </div>
  `;

  try {
    const currentUser = await IGCA_API.user();

    let query = sb
      .from("profiles")
      .select(`
        id,
        full_name,
        username,
        account_type,
        headline,
        bio,
        location,
        industry,
        expertise,
        interests,
        company_name,
        website,
        is_verified,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (currentUser) {
      query = query.neq("id", currentUser.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    profiles = data || [];

    console.log("IGCA Discover profiles:", profiles);

    buildDynamicFilters();
    renderPeople();

  } catch (error) {
    console.error("Discover profiles error:", error);

    peoplePane.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <h3>Unable to load profiles</h3>
        <p>${escapeHTML(error.message || "Something went wrong.")}</p>
      </div>
    `;
  }
}
  /* ---------------------------------------------------------
     DYNAMIC FILTERS
  --------------------------------------------------------- */

  function buildDynamicFilters() {
    const locations = uniqueValues(
      profiles.map(p => p.location)
    );

    const accountTypes = uniqueValues(
      profiles.map(p => p.account_type)
    );

    const industries = uniqueValues(
      profiles.map(p => p.industry)
    );

    const filtersPanel = document.querySelector(".filters-panel");

    if (!filtersPanel) return;

    filtersPanel.innerHTML = `
      ${createFilterGroup(
        "Location",
        "location",
        locations
      )}

      ${createFilterGroup(
        "Professional Type",
        "account_type",
        accountTypes
      )}

      ${createFilterGroup(
        "Industry",
        "industry",
        industries
      )}

      <div class="filter-group">
        <h4>Verification</h4>

        <label class="filter-option">
          <input
            type="checkbox"
            data-filter-type="verified"
            value="verified"
          >
          Verified only
        </label>
      </div>

      <button
        class="btn btn-outline btn-block btn-sm"
        id="clear-filters"
      >
        Clear Filters
      </button>
    `;

    attachFilterListeners();
  }

  function createFilterGroup(title, type, values) {
    if (!values.length) {
      return "";
    }

    return `
      <div class="filter-group">
        <h4>${escapeHTML(title)}</h4>

        ${values.map(value => `
          <label class="filter-option">
            <input
              type="checkbox"
              data-filter-type="${escapeHTML(type)}"
              value="${escapeHTML(value)}"
            >
            ${escapeHTML(formatLabel(value))}
          </label>
        `).join("")}
      </div>
    `;
  }

  function attachFilterListeners() {
    document
      .querySelectorAll(".filters-panel input[type='checkbox']")
      .forEach(input => {

        input.addEventListener("change", () => {

          const type = input.dataset.filterType;

          if (type === "verified") {
            activeFilters.verified = input.checked;
          } else {

            if (input.checked) {

              if (!activeFilters[type].includes(input.value)) {
                activeFilters[type].push(input.value);
              }

            } else {

              activeFilters[type] =
                activeFilters[type].filter(
                  value => value !== input.value
                );
            }
          }

          renderPeople();
        });
      });

    const clearButton =
      document.getElementById("clear-filters");

    if (clearButton) {
      clearButton.addEventListener("click", clearFilters);
    }
  }

  function clearFilters() {

    activeFilters = {
      location: [],
      account_type: [],
      industry: [],
      verified: false
    };

    document
      .querySelectorAll(".filters-panel input")
      .forEach(input => {
        input.checked = false;
      });

    renderPeople();
    peoplePane.innerHTML =
  results.map(profileCard).join("");

attachConnectionButtons();
  }

  /* ---------------------------------------------------------
     SEARCH + FILTER
  --------------------------------------------------------- */

  function renderPeople() {

    const query =
      (searchInput?.value || "")
        .trim()
        .toLowerCase();

    let results = profiles.filter(profile => {

      /* SEARCH */

      if (query) {

        const searchableText = [
          profile.full_name,
          profile.username,
          profile.headline,
          profile.company_name,
          profile.location,
          profile.industry,
          ...(profile.expertise || []),
          ...(profile.interests || [])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      /* LOCATION */

      if (
        activeFilters.location.length &&
        !activeFilters.location.includes(profile.location)
      ) {
        return false;
      }

      /* ACCOUNT TYPE */

      if (
        activeFilters.account_type.length &&
        !activeFilters.account_type.includes(profile.account_type)
      ) {
        return false;
      }

      /* INDUSTRY */

      if (
        activeFilters.industry.length &&
        !activeFilters.industry.includes(profile.industry)
      ) {
        return false;
      }

      /* VERIFIED */

      if (
        activeFilters.verified &&
        !profile.is_verified
      ) {
        return false;
      }

      return true;
    });

    if (!results.length) {

      peoplePane.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <h3>No people found</h3>
          <p>
            Try another name, company, location,
            industry or expertise.
          </p>
        </div>
      `;

      return;
    }

    peoplePane.innerHTML =
      results.map(profileCard).join("");
      attachConnectionButtons();
  }

  /* ---------------------------------------------------------
     PROFILE CARD
  --------------------------------------------------------- */

  function profileCard(profile) {

    const name =
      profile.full_name || "Unnamed User";

    const title =
      profile.headline ||
      profile.account_type ||
      "IGCA Member";

    const company =
      profile.company_name || "";

    const location =
      profile.location || "";

    const industry =
      profile.industry || "";

    const expertise =
      Array.isArray(profile.expertise)
        ? profile.expertise.slice(0, 3)
        : [];

    return `
      <article class="person-card">

        <div class="person-card-top">

          <div class="avatar avatar-md">
            ${escapeHTML(App.initials(name))}
          </div>

          <div style="min-width:0;flex:1;">

            <div style="
              display:flex;
              align-items:center;
              gap:6px;
            ">

              <h3 style="
                font-size:15px;
                margin:0;
              ">
                ${escapeHTML(name)}
              </h3>

              ${
                profile.is_verified
                  ? App.verifyBadgeHTML()
                  : ""
              }

            </div>

            <p class="text-secondary" style="
              font-size:12.5px;
              margin-top:3px;
            ">
              ${escapeHTML(title)}
            </p>

          </div>

        </div>

        ${
          company
            ? `<p class="text-secondary" style="font-size:13px;margin-top:10px;">
                ${escapeHTML(company)}
              </p>`
            : ""
        }

        ${
          location
            ? `<p class="text-secondary" style="font-size:12.5px;margin-top:4px;">
                ${escapeHTML(location)}
              </p>`
            : ""
        }

        ${
          industry
            ? `<p class="text-secondary" style="font-size:12.5px;margin-top:4px;">
                ${escapeHTML(industry)}
              </p>`
            : ""
        }

        ${
          expertise.length
            ? `
              <div class="chip-row" style="margin-top:10px;">
                ${expertise.map(e =>
                  `<span class="chip">${escapeHTML(e)}</span>`
                ).join("")}
              </div>
            `
            : ""
        }

        <div style="
          margin-top:14px;
          display:flex;
          gap:8px;
        ">

          <a
            href="profile.html?id=${encodeURIComponent(profile.id)}"
            class="btn btn-outline btn-sm"
            style="flex:1;text-align:center;"
          >
            View Profile
          </a>

          <button
            class="btn btn-primary btn-sm connect-btn"
            data-id="${escapeHTML(profile.id)}"
          >
            Connect
          </button>

        </div>

      </article>
    `;
  }
async function attachConnectionButtons() {
  const buttons = document.querySelectorAll(".connect-btn");

  for (const button of buttons) {
    const userId = button.dataset.id;

    try {
      const connection = await IGCA_API.connectionStatus(userId);

      if (!connection) {
        button.textContent = "Connect";
        button.classList.remove("btn-outline");
        button.classList.add("btn-primary");
        continue;
      }

      if (connection.status === "pending") {
        const currentUser = await IGCA_API.user();

        if (
          currentUser &&
          connection.requester_id === currentUser.id
        ) {
          button.textContent = "Pending";
          button.disabled = true;
          button.classList.remove("btn-primary");
          button.classList.add("btn-outline");
        } else {
          button.textContent = "Respond";
          button.classList.remove("btn-primary");
          button.classList.add("btn-outline");
        }
      }

      if (connection.status === "accepted") {
        button.textContent = "Connected";
        button.disabled = true;
        button.classList.remove("btn-primary");
        button.classList.add("btn-outline");
      }

      if (connection.status === "rejected") {
        button.textContent = "Connect";
        button.classList.remove("btn-outline");
        button.classList.add("btn-primary");
      }

    } catch (error) {
      console.error(
        "Connection status error:",
        error
      );
    }

    button.addEventListener("click", async () => {
      if (
        button.disabled ||
        button.dataset.processing === "true"
      ) {
        return;
      }

      button.dataset.processing = "true";
      button.disabled = true;
      button.textContent = "Sending...";

      try {
        const result =
          await IGCA_API.sendConnection(userId);

        if (result.status === "pending") {
          button.textContent = "Pending";
          button.classList.remove("btn-primary");
          button.classList.add("btn-outline");
        }

      } catch (error) {
        console.error(
          "Send connection error:",
          error
        );

        alert(
          error.message ||
          "Unable to send connection request."
        );

        button.textContent = "Connect";
        button.disabled = false;

      } finally {
        button.dataset.processing = "false";
      }
    });
  }
}
  /* ---------------------------------------------------------
     SEARCH EVENT
  --------------------------------------------------------- */

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      renderPeople
    );

  }

  /* ---------------------------------------------------------
     TABS
  --------------------------------------------------------- */

  document
    .querySelectorAll(".tab")
    .forEach(tab => {

      tab.addEventListener("click", () => {

        document
          .querySelectorAll(".tab")
          .forEach(t =>
            t.classList.remove("active")
          );

        tab.classList.add("active");

        peoplePane.style.display =
          tab.dataset.tab === "people"
            ? ""
            : "none";

        companyPane.style.display =
          tab.dataset.tab === "companies"
            ? ""
            : "none";

        oppPane.style.display =
          tab.dataset.tab === "opportunities"
            ? ""
            : "none";
      });
    });

  /* ---------------------------------------------------------
     HELPERS
  --------------------------------------------------------- */

  function uniqueValues(values) {

    return [...new Set(
      values
        .filter(Boolean)
        .map(v => String(v).trim())
        .filter(Boolean)
    )].sort();
  }

  function formatLabel(value) {

    return String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, char =>
        char.toUpperCase()
      );
  }

  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* ---------------------------------------------------------
     START
  --------------------------------------------------------- */

  await loadProfiles();

});