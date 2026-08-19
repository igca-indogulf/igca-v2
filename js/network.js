/* ==========================================================================
   IGCA — Network
   Live Supabase Network System
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  App.mountShell("network.html");

  const connectionsPane = document.getElementById("pane-connections");
  const requestsPane = document.getElementById("pane-requests");
  const sentPane = document.getElementById("pane-sent");
  const suggestedPane = document.getElementById("pane-suggested");

  const statConnections = document.getElementById("stat-connections");
  const statRequests = document.getElementById("stat-requests");
  const statSent = document.getElementById("stat-sent");
  const statSuggested = document.getElementById("stat-suggested");

  let currentUser = null;
  let allProfiles = [];
  let allConnections = [];

  /* ---------------------------------------------------------
     HELPERS
  --------------------------------------------------------- */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getOtherUser(connection) {
    if (!currentUser) return null;

    return connection.requester_id === currentUser.id
      ? connection.addressee
      : connection.requester;
  }

  function profileCard(profile, buttonHTML = "") {
    const name = profile.full_name || "IGCA Member";

    const title =
      profile.headline ||
      profile.account_type ||
      "IGCA Member";

    const company = profile.company_name || "";
    const location = profile.location || "";

    return `
      <article class="person-card reveal">

        <div class="person-card-top">

          <div class="avatar avatar-md">
            ${escapeHTML(App.initials(name))}
          </div>

          <div style="min-width:0;flex:1;">

            <h3 style="font-size:15px;margin:0;">
              ${escapeHTML(name)}
            </h3>

            <p class="text-secondary"
               style="font-size:12.5px;margin-top:3px;">
              ${escapeHTML(title)}
            </p>

          </div>

        </div>

        ${
          company
            ? `
              <p class="text-secondary"
                 style="font-size:13px;margin-top:10px;">
                ${escapeHTML(company)}
              </p>
            `
            : ""
        }

        ${
          location
            ? `
              <p class="text-secondary"
                 style="font-size:12.5px;margin-top:4px;">
                ${escapeHTML(location)}
              </p>
            `
            : ""
        }

        <div style="
          display:flex;
          gap:8px;
          margin-top:14px;
        ">

          <a
            href="profile.html?id=${encodeURIComponent(profile.id)}"
            class="btn btn-outline btn-sm"
            style="flex:1;text-align:center;"
          >
            View Profile
          </a>

          ${buttonHTML}

        </div>

      </article>
    `;
  }

  function emptyState(title, text) {
    return App.emptyState(title, text);
  }

  /* ---------------------------------------------------------
     LOAD CURRENT USER
  --------------------------------------------------------- */

  async function loadCurrentUser() {
    currentUser = await IGCA_API.user();

    if (!currentUser) {
      throw new Error("You must be logged in.");
    }
  }

  /* ---------------------------------------------------------
     LOAD CONNECTIONS
  --------------------------------------------------------- */

  async function loadConnections() {

    const { data, error } = await sb
      .from("connections")
      .select(`
        id,
        requester_id,
        addressee_id,
        status,
        created_at,
        requester:requester_id (
          id,
          full_name,
          username,
          account_type,
          headline,
          company_name,
          location,
          industry,
          avatar_url,
          is_verified
        ),
        addressee:addressee_id (
          id,
          full_name,
          username,
          account_type,
          headline,
          company_name,
          location,
          industry,
          avatar_url,
          is_verified
        )
      `)
      .or(
        `requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    allConnections = data || [];
  }

  /* ---------------------------------------------------------
     LOAD PROFILES
  --------------------------------------------------------- */

  async function loadProfiles() {

    const { data, error } = await sb
      .from("profiles")
      .select(`
        id,
        full_name,
        username,
        account_type,
        headline,
        company_name,
        location,
        industry,
        avatar_url,
        is_verified
      `)
      .neq("id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    allProfiles = data || [];
  }

  /* ---------------------------------------------------------
     REQUESTS
  --------------------------------------------------------- */

  function getReceivedRequests() {

    return allConnections.filter(connection =>
      connection.status === "pending" &&
      connection.addressee_id === currentUser.id
    );
  }

  function getSentRequests() {

    return allConnections.filter(connection =>
      connection.status === "pending" &&
      connection.requester_id === currentUser.id
    );
  }

  function getAcceptedConnections() {

    return allConnections.filter(connection =>
      connection.status === "accepted"
    );
  }

  /* ---------------------------------------------------------
     SUGGESTIONS
  --------------------------------------------------------- */

  function getSuggestions() {

    const connectedUserIds = new Set();

    allConnections.forEach(connection => {

      connectedUserIds.add(connection.requester_id);
      connectedUserIds.add(connection.addressee_id);

    });

    return allProfiles.filter(profile =>
      profile.id !== currentUser.id &&
      !connectedUserIds.has(profile.id)
    );
  }

  /* ---------------------------------------------------------
     RENDER CONNECTIONS
  --------------------------------------------------------- */

  function renderConnections() {

    const connections = getAcceptedConnections();

    statConnections.textContent = connections.length;

    if (!connections.length) {

      connectionsPane.innerHTML =
        emptyState(
          "No connections yet",
          "People you connect with will appear here."
        );

      return;
    }

    connectionsPane.innerHTML = connections
      .map(connection => {

        const person = getOtherUser(connection);

        return profileCard(
          person
        );

      })
      .join("");
  }

  /* ---------------------------------------------------------
     RENDER RECEIVED REQUESTS
  --------------------------------------------------------- */

  function renderRequests() {

    const requests = getReceivedRequests();

    statRequests.textContent = requests.length;

    if (!requests.length) {

      requestsPane.innerHTML =
        emptyState(
          "No pending requests",
          "Connection requests you receive will appear here."
        );

      return;
    }

    requestsPane.innerHTML = requests
      .map(connection => {

        const person = connection.requester;

        return profileCard(
          person,
          `
            <button
              class="btn btn-primary btn-sm accept-btn"
              data-id="${escapeHTML(connection.id)}"
            >
              Accept
            </button>

            <button
              class="btn btn-outline btn-sm reject-btn"
              data-id="${escapeHTML(connection.id)}"
            >
              Decline
            </button>
          `
        );

      })
      .join("");

    attachRequestButtons();
  }

  /* ---------------------------------------------------------
     RENDER SENT
  --------------------------------------------------------- */

  function renderSent() {

    const sent = getSentRequests();

    statSent.textContent = sent.length;

    if (!sent.length) {

      sentPane.innerHTML =
        emptyState(
          "No sent requests",
          "Connection requests you send will appear here."
        );

      return;
    }

    sentPane.innerHTML = sent
      .map(connection => {

        const person = connection.addressee;

        return profileCard(
          person,
          `
            <button
              class="btn btn-outline btn-sm withdraw-btn"
              data-id="${escapeHTML(connection.id)}"
            >
              Withdraw
            </button>
          `
        );

      })
      .join("");

    attachWithdrawButtons();
  }

  /* ---------------------------------------------------------
     RENDER SUGGESTIONS
  --------------------------------------------------------- */

  function renderSuggested() {

    const suggestions = getSuggestions();

    statSuggested.textContent = suggestions.length;

    if (!suggestions.length) {

      suggestedPane.innerHTML =
        emptyState(
          "No suggestions yet",
          "We'll suggest people as your network grows."
        );

      return;
    }

    suggestedPane.innerHTML = suggestions
      .slice(0, 30)
      .map(profile => {

        return profileCard(
          profile,
          `
            <button
              class="btn btn-primary btn-sm connect-btn"
              data-id="${escapeHTML(profile.id)}"
            >
              Connect
            </button>
          `
        );

      })
      .join("");

    attachConnectButtons();
  }

  /* ---------------------------------------------------------
     ACCEPT / DECLINE
  --------------------------------------------------------- */

  function attachRequestButtons() {

    document
      .querySelectorAll(".accept-btn")
      .forEach(button => {

        button.addEventListener("click", async () => {

          const id = button.dataset.id;

          button.disabled = true;
          button.textContent = "Accepting...";

          try {

            await IGCA_API.acceptConnection(id);

            await refreshNetwork();

          } catch (error) {

            console.error("Accept connection error:", error);

            alert(
              error.message ||
              "Unable to accept request."
            );

            button.disabled = false;
            button.textContent = "Accept";
          }

        });

      });

    document
      .querySelectorAll(".reject-btn")
      .forEach(button => {

        button.addEventListener("click", async () => {

          const id = button.dataset.id;

          button.disabled = true;
          button.textContent = "Declining...";

          try {

            await IGCA_API.rejectConnection(id);

            await refreshNetwork();

          } catch (error) {

            console.error("Reject connection error:", error);

            alert(
              error.message ||
              "Unable to decline request."
            );

            button.disabled = false;
            button.textContent = "Decline";
          }

        });

      });
  }

  /* ---------------------------------------------------------
     WITHDRAW
  --------------------------------------------------------- */

  function attachWithdrawButtons() {

    document
      .querySelectorAll(".withdraw-btn")
      .forEach(button => {

        button.addEventListener("click", async () => {

          const id = button.dataset.id;

          if (
            !confirm(
              "Withdraw this connection request?"
            )
          ) {
            return;
          }

          button.disabled = true;
          button.textContent = "Withdrawing...";

          try {

            const { error } = await sb
              .from("connections")
              .delete()
              .eq("id", id)
              .eq("requester_id", currentUser.id)
              .eq("status", "pending");

            if (error) throw error;

            await refreshNetwork();

          } catch (error) {

            console.error("Withdraw error:", error);

            alert(
              error.message ||
              "Unable to withdraw request."
            );

            button.disabled = false;
            button.textContent = "Withdraw";
          }

        });

      });
  }

  /* ---------------------------------------------------------
     CONNECT
  --------------------------------------------------------- */

  function attachConnectButtons() {

    document
      .querySelectorAll(".connect-btn")
      .forEach(button => {

        button.addEventListener("click", async () => {

          if (
            button.disabled ||
            button.dataset.processing === "true"
          ) {
            return;
          }

          const userId = button.dataset.id;

          button.dataset.processing = "true";
          button.disabled = true;
          button.textContent = "Sending...";

          try {

            await IGCA_API.sendConnection(userId);

            button.textContent = "Pending";
            button.classList.remove("btn-primary");
            button.classList.add("btn-outline");

            await loadConnections();

            renderSent();
            renderSuggested();

          } catch (error) {

            console.error(
              "Send connection error:",
              error
            );

            alert(
              error.message ||
              "Unable to send connection request."
            );

            button.disabled = false;
            button.textContent = "Connect";

          } finally {

            button.dataset.processing = "false";

          }

        });

      });
  }

  /* ---------------------------------------------------------
     REFRESH
  --------------------------------------------------------- */

  async function refreshNetwork() {

    await loadConnections();

    renderConnections();
    renderRequests();
    renderSent();
    renderSuggested();
  }

  /* ---------------------------------------------------------
     TABS
  --------------------------------------------------------- */

  const panes = {
    connections: "pane-connections",
    requests: "pane-requests",
    sent: "pane-sent",
    suggested: "pane-suggested"
  };

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

        Object.values(panes)
          .forEach(id => {

            const pane =
              document.getElementById(id);

            if (pane) {
              pane.style.display = "none";
            }

          });

        const activePane =
          document.getElementById(
            panes[tab.dataset.tab]
          );

        if (activePane) {
          activePane.style.display = "";
        }

      });

    });

  /* ---------------------------------------------------------
     INITIALIZE
  --------------------------------------------------------- */

  try {

    await loadCurrentUser();
    await loadConnections();
    await loadProfiles();

    renderConnections();
    renderRequests();
    renderSent();
    renderSuggested();

    console.log(
      "IGCA Network loaded successfully."
    );

  } catch (error) {

    console.error(
      "Network initialization error:",
      error
    );

    const message = escapeHTML(
      error.message ||
      "Unable to load network."
    );

    connectionsPane.innerHTML =
      emptyState(
        "Unable to load network",
        message
      );

  }

});