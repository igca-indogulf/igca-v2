/* ==========================================================================
   IGCA — Dashboard
   LIVE SUPABASE DASHBOARD
   - Live profile
   - Live connection stats
   - Live pending requests
   - Live appointments
   - Live unread messages
   - Live recommendations
   - Live avatar photos
   - Search
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  /* =========================================================
     SHELL
     IMPORTANT: DO NOT REMOVE
  ========================================================= */

  try {
    if (window.App && typeof App.mountShell === "function") {
      App.mountShell("dashboard.html");
    }
  } catch (error) {
    console.error("Shell mount error:", error);
  }

  /* =========================================================
     ELEMENTS
  ========================================================= */

  const peopleContainer =
    document.getElementById("dash-people");

  const opportunitiesContainer =
    document.getElementById("dash-opps");

  const insightsContainer =
    document.getElementById("dash-insights");

  const learnContainer =
    document.getElementById("dash-learn");

  const greeting =
    document.getElementById("greeting");

  const statConnections =
    document.getElementById("stat-connections");

  const statPending =
    document.getElementById("stat-pending");

  const statMeetings =
    document.getElementById("stat-meetings");

  const statMessages =
    document.getElementById("stat-messages");

  const searchInput =
    document.querySelector(".search-bar input");

  const searchButton =
    document.querySelector(".search-bar button");

  /* =========================================================
     CURRENT USER
  ========================================================= */

  let currentUser = null;

  try {
    if (
      window.IGCA_API &&
      typeof IGCA_API.profile === "function"
    ) {
      currentUser = await IGCA_API.profile();
    }
  } catch (error) {
    console.error(
      "Unable to load current profile:",
      error
    );
  }

  /* =========================================================
     GREETING
  ========================================================= */

  function updateGreeting() {

    if (!greeting) return;

    const name =
      currentUser?.full_name ||
      "there";

    const hour =
      new Date().getHours();

    let text = "Good morning";

    if (
      hour >= 12 &&
      hour < 17
    ) {
      text = "Good afternoon";
    }

    if (hour >= 17) {
      text = "Good evening";
    }

    greeting.textContent =
      `${text}, ${name} 👋`;
  }

  updateGreeting();

  /* =========================================================
     HELPERS
  ========================================================= */

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatLabel(value) {
    return String(value || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, char =>
        char.toUpperCase()
      );
  }

  function arrayValue(value) {

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {

      try {
        const parsed =
          JSON.parse(value);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (_) {}

      return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  function intersection(a, b) {

    const first =
      a.map(normalize);

    const second =
      b.map(normalize);

    return first.filter(
      value => second.includes(value)
    );
  }

  function initials(name) {

    if (
      window.App &&
      typeof App.initials === "function"
    ) {
      return App.initials(name);
    }

    return String(name || "IG")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word[0])
      .join("")
      .toUpperCase();
  }

  /* =========================================================
     LIVE DASHBOARD STATS
  ========================================================= */

  async function loadStats() {

    if (!currentUser?.id) {
      return;
    }

    try {

      /* -------------------------------------------------------
         CONNECTIONS
      ------------------------------------------------------- */

      const {
        data: connections,
        error: connectionError
      } = await sb
        .from("connections")
        .select(
          "id, requester_id, addressee_id, status"
        )
        .or(
          `requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`
        );

      if (connectionError) {
        console.error(
          "Connection stats error:",
          connectionError
        );
      }

      const connectionRows =
        connections || [];

      const accepted =
        connectionRows.filter(
          row => row.status === "accepted"
        );

      const pending =
        connectionRows.filter(
          row =>
            row.status === "pending" &&
            row.addressee_id === currentUser.id
        );

      if (statConnections) {
        statConnections.textContent =
          accepted.length;
      }

      if (statPending) {
        statPending.textContent =
          pending.length;
      }

      /* -------------------------------------------------------
         APPOINTMENTS / MEETINGS
      ------------------------------------------------------- */

      const now =
        new Date().toISOString();

      const {
        data: appointments,
        error: appointmentError
      } = await sb
        .from("appointments")
        .select(
          "id, requester_id, recipient_id, starts_at, ends_at, title, status"
        )
        .or(
          `requester_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`
        )
        .gte(
          "starts_at",
          now
        )
        .order(
          "starts_at",
          {
            ascending: true
          }
        );

      if (appointmentError) {

        console.error(
          "Appointment stats error:",
          appointmentError
        );

      } else if (statMeetings) {

        const upcoming =
          (appointments || []).filter(
            appointment => {

              if (
                !appointment.status
              ) {
                return true;
              }

              return [
                "pending",
                "accepted",
                "confirmed",
                "scheduled"
              ].includes(
                normalize(
                  appointment.status
                )
              );
            }
          );

        statMeetings.textContent =
          upcoming.length;
      }

      /* -------------------------------------------------------
         UNREAD MESSAGES
      ------------------------------------------------------- */

      const {
        data: memberships,
        error: membershipError
      } = await sb
        .from("conversation_members")
        .select("conversation_id")
        .eq(
          "user_id",
          currentUser.id
        );

      if (membershipError) {

        console.error(
          "Conversation membership error:",
          membershipError
        );

      } else {

        const conversationIds =
          (memberships || [])
            .map(
              item =>
                item.conversation_id
            )
            .filter(Boolean);

        if (
          !conversationIds.length
        ) {

          if (statMessages) {
            statMessages.textContent = "0";
          }

        } else {

          const {
            count,
            error: messageError
          } = await sb
            .from("messages")
            .select(
              "id",
              {
                count: "exact",
                head: true
              }
            )
            .in(
              "conversation_id",
              conversationIds
            )
            .neq(
              "sender_id",
              currentUser.id
            )
            .is(
              "read_at",
              null
            );

          if (messageError) {

            console.error(
              "Unread message error:",
              messageError
            );

          } else if (statMessages) {

            statMessages.textContent =
              count || 0;
          }
        }
      }

    } catch (error) {

      console.error(
        "Dashboard stats error:",
        error
      );

    }
  }

  /* =========================================================
     LOAD PEOPLE
  ========================================================= */

  let allPeople = [];

  async function loadRecommendations(
    searchTerm = ""
  ) {

    if (!peopleContainer) {
      return;
    }

    peopleContainer.innerHTML = `
      <div class="empty-state"
           style="grid-column:1/-1;">
        <h3>Loading people...</h3>
        <p>Fetching live recommendations.</p>
      </div>
    `;

    try {

      const {
        data,
        error
      } = await sb
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
          avatar_url,
          is_verified,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        );

      if (error) {
        throw error;
      }

      let people =
        data || [];

      /* Remove current user */

      if (currentUser?.id) {

        people =
          people.filter(
            person =>
              person.id !==
              currentUser.id
          );
      }

      /* Save complete live list */

      allPeople =
        [...people];

      /* -------------------------------------------------------
         SEARCH
      ------------------------------------------------------- */

      const query =
        normalize(searchTerm);

      if (query) {

        people =
          people.filter(
            person => {

              const searchable = [
                person.full_name,
                person.username,
                person.headline,
                person.company_name,
                person.location,
                person.industry,
                ...arrayValue(
                  person.expertise
                ),
                ...arrayValue(
                  person.interests
                )
              ]
                .filter(Boolean)
                .join(" ");

              return normalize(
                searchable
              ).includes(query);
            }
          );
      }

      /* -------------------------------------------------------
         SCORE
      ------------------------------------------------------- */

      people =
        people
          .map(person => ({
            ...person,
            score:
              recommendationScore(
                currentUser,
                person
              )
          }))
          .sort(
            (a, b) =>
              b.score - a.score
          );

      /* Top 6 */

      people =
        people.slice(0, 6);

      if (!people.length) {

        peopleContainer.innerHTML = `
          <div class="empty-state"
               style="grid-column:1/-1;">
            <h3>
              ${
                query
                  ? "No people found"
                  : "No recommendations yet"
              }
            </h3>
            <p>
              ${
                query
                  ? "Try another search."
                  : "More professionals will appear as the network grows."
              }
            </p>
          </div>
        `;

        return;
      }

      peopleContainer.innerHTML =
        people
          .map(personCard)
          .join("");

    } catch (error) {

      console.error(
        "Dashboard recommendation error:",
        error
      );

      peopleContainer.innerHTML = `
        <div class="empty-state"
             style="grid-column:1/-1;">
          <h3>
            Recommendations unavailable
          </h3>

          <p>
            ${escapeHTML(
              error.message ||
              "Unable to load recommendations."
            )}
          </p>
        </div>
      `;
    }
  }

  /* =========================================================
     RECOMMENDATION SCORE
  ========================================================= */

  function recommendationScore(
    me,
    person
  ) {

    if (!me) {
      return 0;
    }

    let score = 0;

    /* Location */

    if (
      me.location &&
      person.location &&
      normalize(me.location) ===
      normalize(person.location)
    ) {
      score += 30;
    }

    /* Industry */

    if (
      me.industry &&
      person.industry &&
      normalize(me.industry) ===
      normalize(person.industry)
    ) {
      score += 30;
    }

    /* Expertise */

    const myExpertise =
      arrayValue(me.expertise);

    const theirExpertise =
      arrayValue(person.expertise);

    score +=
      intersection(
        myExpertise,
        theirExpertise
      ).length * 10;

    /* Interests */

    const myInterests =
      arrayValue(me.interests);

    const theirInterests =
      arrayValue(person.interests);

    score +=
      intersection(
        myInterests,
        theirInterests
      ).length * 8;

    /* Verified */

    if (
      person.is_verified
    ) {
      score += 5;
    }

    return score;
  }

  /* =========================================================
     PERSON CARD
  ========================================================= */

  function personCard(person) {

    const name =
      person.full_name ||
      "IGCA Member";

    const title =
      person.headline ||
      formatLabel(
        person.account_type ||
        "Professional"
      );

    const company =
      person.company_name ||
      "";

    const location =
      person.location ||
      "";

    const industry =
      person.industry ||
      "";

    const expertise =
      arrayValue(
        person.expertise
      ).slice(0, 2);

    const avatar =
      person.avatar_url;

    /* -------------------------------------------------------
       AVATAR
    ------------------------------------------------------- */

    const avatarHTML =
      avatar
        ? `
          <img
            src="${escapeHTML(avatar)}"
            alt="${escapeHTML(name)}"
            class="avatar avatar-md"
            style="
              object-fit:cover;
              display:block;
            "
            onerror="
              this.style.display='none';
              this.nextElementSibling.style.display='flex';
            "
          >

          <div
            class="avatar avatar-md"
            style="
              display:none;
              align-items:center;
              justify-content:center;
            "
          >
            ${escapeHTML(
              initials(name)
            )}
          </div>
        `
        : `
          <div
            class="avatar avatar-md"
          >
            ${escapeHTML(
              initials(name)
            )}
          </div>
        `;

    return `
      <article class="person-card">

        <div class="person-card-top">

          ${avatarHTML}

          <div style="
            min-width:0;
            flex:1;
          ">

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
                person.is_verified &&
                window.App &&
                typeof App.verifyBadgeHTML ===
                "function"
                  ? App.verifyBadgeHTML()
                  : ""
              }

            </div>

            <p
              class="text-secondary"
              style="
                font-size:12.5px;
                margin-top:3px;
              "
            >
              ${escapeHTML(title)}
            </p>

          </div>

        </div>

        ${
          company
            ? `
              <p
                class="text-secondary"
                style="
                  font-size:13px;
                  margin-top:10px;
                "
              >
                ${escapeHTML(company)}
              </p>
            `
            : ""
        }

        ${
          location
            ? `
              <p
                class="text-secondary"
                style="
                  font-size:12.5px;
                  margin-top:4px;
                "
              >
                ${escapeHTML(location)}
              </p>
            `
            : ""
        }

        ${
          industry
            ? `
              <p
                class="text-secondary"
                style="
                  font-size:12.5px;
                  margin-top:4px;
                "
              >
                ${escapeHTML(industry)}
              </p>
            `
            : ""
        }

        ${
          expertise.length
            ? `
              <div
                class="chip-row"
                style="margin-top:10px;"
              >

                ${expertise
                  .map(
                    item => `
                      <span class="chip">
                        ${escapeHTML(item)}
                      </span>
                    `
                  )
                  .join("")}

              </div>
            `
            : ""
        }

        <div style="
          display:flex;
          gap:8px;
          margin-top:14px;
        ">

          <a
            href="profile.html?id=${encodeURIComponent(
              person.id
            )}"
            class="btn btn-outline btn-sm"
            style="
              flex:1;
              text-align:center;
            "
          >
            View Profile
          </a>

          <button
            type="button"
            class="btn btn-primary btn-sm"
            data-connect-id="${escapeHTML(
              person.id
            )}"
          >
            Connect
          </button>

        </div>

      </article>
    `;
  }

  /* =========================================================
     CONNECT BUTTON
  ========================================================= */

  document.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          "[data-connect-id]"
        );

      if (!button) {
        return;
      }

      const personId =
        button.dataset.connectId;

      if (!personId) {
        return;
      }

      try {

        button.disabled = true;

        button.textContent =
          "Sending...";

        await IGCA_API.sendConnection(
          personId
        );

        button.textContent =
          "Requested";

        button.classList.remove(
          "btn-primary"
        );

        button.classList.add(
          "btn-outline"
        );

        await loadStats();

      } catch (error) {

        console.error(
          "Connection error:",
          error
        );

        button.disabled =
          false;

        button.textContent =
          "Connect";

        alert(
          error.message ||
          "Unable to send connection request."
        );
      }
    }
  );

  /* =========================================================
     SEARCH
  ========================================================= */

  async function performSearch() {

    const query =
      searchInput
        ? searchInput.value.trim()
        : "";

    await loadRecommendations(
      query
    );
  }

  if (searchButton) {

    searchButton.addEventListener(
      "click",
      performSearch
    );
  }

  if (searchInput) {

    searchInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {
          event.preventDefault();
          performSearch();
        }

      }
    );

    /* Live search */

    let searchTimer;

    searchInput.addEventListener(
      "input",
      () => {

        clearTimeout(
          searchTimer
        );

        searchTimer =
          setTimeout(
            performSearch,
            300
          );
      }
    );
  }

  /* =========================================================
     PLACEHOLDER SECTIONS
     ========================================================= */

  function renderEmptySections() {

    if (
      opportunitiesContainer &&
      !opportunitiesContainer.children.length
    ) {

      opportunitiesContainer.innerHTML = `
        <div class="empty-state"
             style="grid-column:1/-1;">
          <h3>Opportunities</h3>
          <p>
            Discover companies and opportunities from the network.
          </p>
        </div>
      `;
    }

    if (
      insightsContainer &&
      !insightsContainer.children.length
    ) {

      insightsContainer.innerHTML = `
        <div class="empty-state"
             style="grid-column:1/-1;">
          <h3>Latest Insights</h3>
          <p>
            Latest professional insights will appear here.
          </p>
        </div>
      `;
    }

    if (
      learnContainer &&
      !learnContainer.children.length
    ) {

      learnContainer.innerHTML = `
        <div class="empty-state"
             style="grid-column:1/-1;">
          <h3>Learn & Grow</h3>
          <p>
            Learning resources will appear here.
          </p>
        </div>
      `;
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  await Promise.all([
    loadStats(),
    loadRecommendations()
  ]);

  renderEmptySections();

  /* =========================================================
     REALTIME REFRESH
  ========================================================= */

  try {

    const dashboardChannel =
      sb
        .channel(
          "igca-dashboard-live-" +
          Date.now()
        )

        /* Connections */

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "connections"
          },
          async () => {
            await loadStats();
            await loadRecommendations(
              searchInput
                ? searchInput.value.trim()
                : ""
            );
          }
        )

        /* Appointments */

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "appointments"
          },
          async () => {
            await loadStats();
          }
        )

        /* Messages */

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages"
          },
          async () => {
            await loadStats();
          }
        )

        /* Profiles */

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles"
          },
          async () => {

            await loadRecommendations(
              searchInput
                ? searchInput.value.trim()
                : ""
            );
          }
        )

        .subscribe(
          status => {

            console.log(
              "IGCA Dashboard Realtime:",
              status
            );
          }
        );

    window.IGCA_DASHBOARD_CHANNEL =
      dashboardChannel;

  } catch (error) {

    console.error(
      "Dashboard realtime setup error:",
      error
    );
  }

  console.log(
    "IGCA Dashboard loaded — LIVE"
  );
});