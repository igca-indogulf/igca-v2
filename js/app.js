/* ==========================================================================
   IGCA — Shared App Utilities
   ==========================================================================
   Global:
   - NetGraphics
   - App
   - Authentication Guard
   - Shared Sidebar
   - Shared Header
   - Bottom Navigation
   - Live User Profile
   - Logout
   ========================================================================== */


/* ==========================================================================
   NETWORK GRAPHICS
   ========================================================================== */

const NetGraphics = {

  nodesThumb(){

    return `
      <svg viewBox="0 0 300 120"
           preserveAspectRatio="xMidYMid slice"
           style="
             width:100%;
             height:100%;
             background:var(--surface-secondary);
           ">

        <line x1="40" y1="70"
              x2="120" y2="30"
              stroke="var(--border-strong)"
              stroke-width="1"/>

        <line x1="120" y1="30"
              x2="210" y2="60"
              stroke="var(--border-strong)"
              stroke-width="1"/>

        <line x1="120" y1="30"
              x2="150" y2="95"
              stroke="var(--border-strong)"
              stroke-width="1"/>

        <line x1="210" y1="60"
              x2="270" y2="25"
              stroke="var(--border-strong)"
              stroke-width="1"/>

        <circle class="net-node"
                cx="40"
                cy="70"
                r="4"
                fill="var(--accent)"/>

        <circle class="net-node n2"
                cx="120"
                cy="30"
                r="5"
                fill="var(--primary)"/>

        <circle class="net-node n3"
                cx="210"
                cy="60"
                r="4"
                fill="var(--accent)"/>

        <circle class="net-node n4 slow"
                cx="150"
                cy="95"
                r="3.5"
                fill="var(--primary-tint)"/>

        <circle class="net-node n5 slow"
                cx="270"
                cy="25"
                r="3.5"
                fill="var(--accent)"/>

      </svg>
    `;
  },


  constellationRule(){

    return `
      <svg viewBox="0 0 600 24"
           preserveAspectRatio="none"
           style="width:100%;height:24px;">

        <line x1="0"
              y1="12"
              x2="600"
              y2="12"
              stroke="var(--border)"
              stroke-width="1"/>

        <circle cx="30"
                cy="12"
                r="3"
                fill="var(--accent)"/>

        <circle cx="180"
                cy="12"
                r="3"
                fill="var(--border-strong)"/>

        <circle cx="330"
                cy="12"
                r="3"
                fill="var(--accent)"/>

        <circle cx="480"
                cy="12"
                r="3"
                fill="var(--border-strong)"/>

        <circle cx="570"
                cy="12"
                r="3"
                fill="var(--accent)"/>

      </svg>
    `;
  }

};


/* ==========================================================================
   APP
   ========================================================================== */

const App = {


  /* ------------------------------------------------------------------------
     HELPERS
  ------------------------------------------------------------------------ */

  initials(name){

    const value =
      String(name || "IG")
        .trim();

    if(!value){
      return "IG";
    }

    return value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase();
  },


  avatarHTML(name, size = ""){

    return `
      <div class="avatar ${size}">
        ${App.initials(name)}
      </div>
    `;
  },


  emptyState(title, body){

    return `
      <div class="empty-state">

        <svg width="44"
             height="44"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="1.5"
             style="
               color:var(--border-strong);
               margin:0 auto;
             ">

          <circle cx="12"
                  cy="8"
                  r="4"/>

          <path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>

        </svg>

        <h3>${title || ""}</h3>

        <p>${body || ""}</p>

      </div>
    `;
  },


  verifyBadgeHTML(){

    return `
      <span class="verify-badge"
            title="Verified professional">

        <svg viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2">

          <path d="
            M12 2
            l2.2 2.2
            3-.4
            .9 2.9
            2.9.9
            -.4 3
            2.4 2.2
            -2.4 2.2
            .4 3
            -2.9.9
            -.9 2.9
            -3-.4
            L12 23
            l-2.2-2.4
            -3 .4
            -.9-2.9
            -2.9-.9
            .4-3
            L1 12
            l2.4-2.2
            -.4-3
            2.9-.9
            .9-2.9
            3 .4z
          "/>

          <path d="M9 12l2 2 4-4"/>

        </svg>

        Verified

      </span>
    `;
  },


  chipRow(items = []){

    if(!Array.isArray(items) || !items.length){
      return "";
    }

    return `
      <div class="chip-row">

        ${items
          .filter(Boolean)
          .map(item => `
            <span class="chip">
              ${item}
            </span>
          `)
          .join("")}

      </div>
    `;
  },


  /* ------------------------------------------------------------------------
     CARDS
  ------------------------------------------------------------------------ */

  personCardHTML(p = {}){

    return `
      <div class="profile-card reveal">

        <div class="profile-card-top">

          ${App.avatarHTML(p.name)}

          <div>

            <div class="profile-name-row">
              <h3>${p.name || ""}</h3>
            </div>

            <div class="title">
              ${p.title || ""}
            </div>

            <div class="meta">

              ${
                p.company
                  ? `<span>${p.company}</span>`
                  : ""
              }

              ${
                p.location
                  ? ` · <span>${p.location}</span>`
                  : ""
              }

              ${
                p.verified
                  ? App.verifyBadgeHTML()
                  : ""
              }

            </div>

          </div>

        </div>

        ${App.chipRow(
          Array.isArray(p.expertise)
            ? p.expertise.slice(0, 3)
            : []
        )}

        <div class="meta">
          ${p.mutual || 0} mutual connections
        </div>

        <div class="profile-card-actions">

          <a class="btn btn-outline"
             href="profile.html?id=${encodeURIComponent(p.id || "")}">
            View Profile
          </a>

          <button
            class="btn btn-primary"
            type="button">
            Connect
          </button>

        </div>

      </div>
    `;
  },


  companyCardHTML(c = {}){

    return `
      <div class="profile-card reveal">

        <div class="profile-card-top">

          <div
            class="avatar"
            style="
              background:
              linear-gradient(
                135deg,
                var(--accent-light),
                var(--accent)
              );
            ">

            ${App.initials(c.name)}

          </div>

          <div>

            <h3>${c.name || ""}</h3>

            <div class="title">
              ${c.type || ""}
            </div>

            <div class="meta">

              ${
                c.location
                  ? `<span>${c.location}</span>`
                  : ""
              }

              ${
                c.aum
                  ? ` · <span>${c.aum}</span>`
                  : ""
              }

            </div>

          </div>

        </div>

        ${App.chipRow(c.focus || [])}

        <div class="profile-card-actions">

          <a
            class="btn btn-outline"
            href="company.html?id=${encodeURIComponent(c.id || "")}">
            View Company
          </a>

          <button
            class="btn btn-primary"
            type="button">
            Follow
          </button>

        </div>

      </div>
    `;
  },


  opportunityCardHTML(o = {}){

    return `
      <div class="card card-pad reveal">

        ${
          o.sector
            ? `
              <span class="badge badge-neutral">
                ${o.sector}
              </span>
            `
            : ""
        }

        <h3 style="
          margin-top:10px;
          font-size:15.5px;
        ">
          ${o.title || ""}
        </h3>

        <p
          class="text-secondary"
          style="
            font-size:13.5px;
            margin-top:6px;
          ">
          ${o.detail || ""}
        </p>

        ${
          o.stage
            ? `
              <div
                class="meta"
                style="margin-top:12px;">
                ${o.stage}
              </div>
            `
            : ""
        }

      </div>
    `;
  },


  articleCardHTML(a = {}){

    return `
      <div class="article-card reveal">

        <div class="article-thumb">
          ${NetGraphics.nodesThumb()}
        </div>

        <div class="body">

          <div class="cat">
            ${a.cat || ""}
          </div>

          <h3>
            ${a.title || ""}
          </h3>

          <div class="article-meta">

            <span>
              ${a.author || ""}
            </span>

            <span>
              ${a.read || ""}
            </span>

          </div>

        </div>

      </div>
    `;
  },


  learnCardHTML(a = {}){

    return `
      <div
        class="card card-pad reveal"
        style="
          display:flex;
          flex-direction:column;
          gap:8px;
        ">

        <div
          class="cat"
          style="
            font-family:var(--font-mono);
            font-size:11px;
            text-transform:uppercase;
            color:var(--accent);
            letter-spacing:.06em;
          ">

          ${a.cat || ""}

        </div>

        <h3
          style="
            font-size:15px;
            line-height:1.4;
          ">

          ${a.title || ""}

        </h3>

        <div class="article-meta">

          <span>
            ${a.author || ""}
          </span>

          <span>
            ${a.read || ""}
          </span>

        </div>

        <button
          class="btn btn-ghost btn-sm"
          type="button"
          style="
            align-self:flex-start;
            padding-left:0;
          ">

          Save for later

        </button>

      </div>
    `;
  },


  /* ==========================================================================
     MOBILE NAV
     ========================================================================== */

  toggleMobileNav(){

    const sidebar =
      document.querySelector(".app-sidebar");

    if(!sidebar){
      return;
    }

    sidebar.classList.toggle("open");
  },


  closeMobileNav(){

    const sidebar =
      document.querySelector(".app-sidebar");

    if(sidebar){
      sidebar.classList.remove("open");
    }
  },


  /* ==========================================================================
     ACTIVE NAV
     ========================================================================== */

  setActiveNav(){

    const currentPage =
      location.pathname
        .split("/")
        .pop()
        .toLowerCase() || "index.html";

    document
      .querySelectorAll(
        ".nav-link, .bottom-nav a"
      )
      .forEach(link => {

        const href =
          link.getAttribute("href");

        if(!href){
          return;
        }

        const cleanHref =
          href
            .split("?")[0]
            .split("#")[0]
            .split("/")
            .pop()
            .toLowerCase();

        link.classList.toggle(
          "active",
          cleanHref === currentPage
        );

      });
  },


  /* ==========================================================================
     HEADER
     ========================================================================== */

  initHeader(){

    return true;
  },


  /* ==========================================================================
     SIDEBAR
     ========================================================================== */

  sidebarHTML(active){

    const link = (
      href,
      label,
      icon
    ) => {

      const currentPage =
        location.pathname
          .split("/")
          .pop()
          .toLowerCase();

      const isActive =
        active === href ||
        (
          !active &&
          currentPage === href.toLowerCase()
        );

      return `
        <a
          class="nav-link${isActive ? " active" : ""}"
          href="${href}">

          ${icon}

          <span>
            ${label}
          </span>

        </a>
      `;
    };


    const ic = {


      dashboard: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <rect
            x="3"
            y="3"
            width="7"
            height="9"
            rx="1.5"/>

          <rect
            x="14"
            y="3"
            width="7"
            height="5"
            rx="1.5"/>

          <rect
            x="14"
            y="12"
            width="7"
            height="9"
            rx="1.5"/>

          <rect
            x="3"
            y="16"
            width="7"
            height="5"
            rx="1.5"/>

        </svg>
      `,


      discover: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <circle
            cx="11"
            cy="11"
            r="7"/>

          <path
            d="M21 21l-4.3-4.3"/>

        </svg>
      `,


      network: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <circle
            cx="12"
            cy="5"
            r="2.5"/>

          <circle
            cx="5"
            cy="19"
            r="2.5"/>

          <circle
            cx="19"
            cy="19"
            r="2.5"/>

          <path d="M12 7.5V14"/>
          <path d="M12 14L6.5 17"/>
          <path d="M12 14l5.5 3"/>

        </svg>
      `,


      messages: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <path
            d="
              M21 15
              a2 2 0 01-2 2
              H7
              l-4 4
              V5
              a2 2 0 012-2
              h14
              a2 2 0 012 2z
            "/>

        </svg>
      `,


      appointments: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"/>

          <path d="M16 3v4"/>
          <path d="M8 3v4"/>
          <path d="M3 10h18"/>

        </svg>
      `,


      learn: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <path
            d="M2 6l10-4 10 4-10 4-10-4z"/>

          <path
            d="
              M6 10v6
              c0 1.5 2.5 3 6 3
              s6-1.5 6-3v-6
            "/>

        </svg>
      `,


      ai: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <rect
            x="4"
            y="7"
            width="16"
            height="12"
            rx="2"/>

          <path d="M9 3v4"/>
          <path d="M15 3v4"/>
          <path d="M9 13h.01"/>
          <path d="M15 13h.01"/>

        </svg>
      `,


      notif: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <path
            d="
              M18 8
              a6 6 0 10-12 0
              c0 4-2 5-2 6
              h16
              c0-1-2-2-2-6z
            "/>

          <path d="M10 20a2 2 0 004 0"/>

        </svg>
      `,


      settings: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <circle
            cx="12"
            cy="12"
            r="3"/>

          <path
            d="
              M19.4 15
              a1.7 1.7 0 00.3 1.9
              l.1.1
              a2 2 0 11-2.8 2.8
              l-.1-.1
              a1.7 1.7 0 00-1.9-.3
              1.7 1.7 0 00-1 1.6
              V21
              a2 2 0 11-4 0
              v-.2
              a1.7 1.7 0 00-1-1.5
              1.7 1.7 0 00-1.9.3
              l-.1.1
              a2 2 0 11-2.8-2.8
              l.1-.1
              a1.7 1.7 0 00.3-1.9
              1.7 1.7 0 00-1.5-1H3
              a2 2 0 110-4
              h.2
              a1.7 1.7 0 001.5-1
              1.7 1.7 0 00-.3-1.9
              l-.1-.1
              a2 2 0 112.8-2.8
              l.1.1
              a1.7 1.7 0 001.9.3
              H10
              a1.7 1.7 0 000-1.6
              V3
              a2 2 0 114 0
              v.2
              a1.7 1.7 0 001 1.5
              1.7 1.7 0 001.9-.3
              l.1-.1
              a2 2 0 112.8 2.8
              l-.1.1
              a1.7 1.7 0 00-.3 1.9
              v0
              a1.7 1.7 0 001.5 1H21
              a2 2 0 110 4
              h-.2
              a1.7 1.7 0 00-1.4.9z
            "/>

        </svg>
      `
    };


    return `

      <!-- BRAND -->

      <div class="brand">

        <svg
          class="brand-mark"
          viewBox="0 0 30 30"
          fill="none">

          <circle
            cx="15"
            cy="6"
            r="3"
            fill="#AD8A4D"/>

          <circle
            cx="6"
            cy="20"
            r="3"
            fill="#fff"/>

          <circle
            cx="24"
            cy="20"
            r="3"
            fill="#fff"/>

          <circle
            cx="15"
            cy="27"
            r="2.4"
            fill="#AD8A4D"/>

          <path
            d="
              M15 6L6 20
              M15 6L24 20
              M6 20L15 27
              M24 20L15 27
            "
            stroke="rgba(255,255,255,.3)"
            stroke-width="1.2"/>

        </svg>

        IGCA

      </div>


      <!-- NAVIGATION -->

      <div class="nav-group">

        ${link(
          "dashboard.html",
          "Dashboard",
          ic.dashboard
        )}


        <div class="nav-label">
          Discover
        </div>


        ${link(
          "discover.html",
          "People &amp; Companies",
          ic.discover
        )}


        ${link(
          "network.html",
          "My Network",
          ic.network
        )}


        <div class="nav-label">
          Communicate
        </div>


        ${link(
          "messages.html",
          "Messages",
          ic.messages
        )}


        ${link(
          "appointments.html",
          "Appointments",
          ic.appointments
        )}


        <div class="nav-label">
          Grow
        </div>


        ${link(
          "learn.html",
          "Learn &amp; Grow",
          ic.learn
        )}


        ${link(
          "ai-research.html",
          "AI Research",
          ic.ai
        )}


        <div class="nav-label">
          Account
        </div>


        ${link(
          "notifications.html",
          "Notifications",
          ic.notif
        )}


        ${link(
          "settings.html",
          "Settings",
          ic.settings
        )}

      </div>


      <!-- SIDEBAR FOOTER -->

      <div class="sidebar-footer">

        <a
          class="sidebar-profile"
          href="profile.html"
          data-user-chrome>

          <div
            class="avatar avatar-sm"
            data-user-avatar>
            ••
          </div>

          <div>

            <div
              class="name"
              data-user-name>
              Loading…
            </div>

            <div
              class="role"
              data-user-role>
            </div>

          </div>

        </a>


        <button
          class="btn-ghost btn-icon"
          type="button"
          onclick="App.logout()"
          aria-label="Log out"
          title="Log out"
          style="margin-left:6px;">

          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2">

            <path
              d="
                M9 21H5
                a2 2 0 01-2-2
                V5
                a2 2 0 012-2
                h4
              "/>

            <path d="M16 17l5-5-5-5"/>

            <path d="M21 12H9"/>

          </svg>

        </button>

      </div>

    `;
  },


  /* ==========================================================================
     BOTTOM NAV
     ========================================================================== */

  bottomNavHTML(active){

    const link = (
      href,
      label,
      icon
    ) => {

      const currentPage =
        location.pathname
          .split("/")
          .pop()
          .toLowerCase();

      const isActive =
        active === href ||
        currentPage === href.toLowerCase();

      return `
        <a
          class="${isActive ? "active" : ""}"
          href="${href}">

          ${icon}

          <span>
            ${label}
          </span>

        </a>
      `;
    };


    return `

      ${link(
        "dashboard.html",
        "Home",
        `
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">

            <path d="M3 11l9-7 9 7"/>
            <path d="M5 10v10h14V10"/>

          </svg>
        `
      )}


      ${link(
        "discover.html",
        "Discover",
        `
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">

            <circle
              cx="11"
              cy="11"
              r="7"/>

            <path
              d="M21 21l-4.3-4.3"/>

          </svg>
        `
      )}


      ${link(
        "network.html",
        "Network",
        `
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">

            <circle
              cx="12"
              cy="5"
              r="2.5"/>

            <circle
              cx="5"
              cy="19"
              r="2.5"/>

            <circle
              cx="19"
              cy="19"
              r="2.5"/>

            <path d="M12 7.5V14"/>
            <path d="M12 14L6.5 17"/>
            <path d="M12 14l5.5 3"/>

          </svg>
        `
      )}


      ${link(
        "messages.html",
        "Messages",
        `
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">

            <path
              d="
                M21 15
                a2 2 0 01-2 2
                H7
                l-4 4
                V5
                a2 2 0 012-2
                h14
                a2 2 0 012 2z
              "/>

          </svg>
        `
      )}


      ${link(
        "profile.html",
        "Profile",
        `
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">

            <circle
              cx="12"
              cy="8"
              r="4"/>

            <path
              d="
                M4 21
                v-1
                a8 8 0 0116 0
                v1
              "/>

          </svg>
        `
      )}

    `;
  },


  /* ==========================================================================
     HEADER
     ========================================================================== */

  headerHTML(){

    return `

      <!-- MOBILE MENU -->

      <button
        class="hamburger btn-ghost btn-icon"
        type="button"
        onclick="App.toggleMobileNav()"
        aria-label="Open menu">

        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <path d="M4 7h16"/>
          <path d="M4 12h16"/>
          <path d="M4 17h16"/>

        </svg>

      </button>


      <!-- SEARCH -->

      <div class="search-bar">

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <circle
            cx="11"
            cy="11"
            r="7"/>

          <path
            d="M21 21l-4.3-4.3"/>

        </svg>


        <input
          type="text"
          placeholder="Search people, companies, industries, opportunities..."
          autocomplete="off">

      </div>


      <!-- HEADER ACTIONS -->

      <div
        class="header-actions"
        style="
          display:flex;
          gap:6px;
          align-items:center;
        ">


        <!-- Notifications -->

        <a
          class="header-icon-btn"
          href="notifications.html"
          aria-label="Notifications">

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">

            <path
              d="
                M18 8
                a6 6 0 10-12 0
                c0 4-2 5-2 6
                h16
                c0-1-2-2-2-6z
              "/>

            <path
              d="M10 20a2 2 0 004 0"/>

          </svg>

          <span class="dot-flag"></span>

        </a>


        <!-- Messages -->

        <a
          class="header-icon-btn"
          href="messages.html"
          aria-label="Messages">

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2">

            <path
              d="
                M21 15
                a2 2 0 01-2 2
                H7
                l-4 4
                V5
                a2 2 0 012-2
                h14
                a2 2 0 012 2z
              "/>

          </svg>

        </a>


        <!-- Profile -->

        <a
          class="sidebar-profile"
          href="profile.html"
          style="padding:4px;"
          data-user-chrome>

          <div
            class="avatar avatar-sm"
            data-user-avatar>
            ••
          </div>

        </a>


        <!-- Logout -->

        <button
          class="header-icon-btn"
          type="button"
          onclick="App.logout()"
          aria-label="Log out"
          title="Log out">

          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2">

            <path
              d="
                M9 21H5
                a2 2 0 01-2-2
                V5
                a2 2 0 012-2
                h4
              "/>

            <path d="M16 17l5-5-5-5"/>

            <path d="M21 12H9"/>

          </svg>

        </button>

      </div>

    `;
  },


  /* ==========================================================================
     LOGOUT
     ========================================================================== */

  async logout(){

    try{

      if(
        window.sb &&
        sb.auth &&
        typeof sb.auth.signOut === "function"
      ){

        await sb.auth.signOut();

      }

    }catch(error){

      console.warn(
        "IGCA: Logout error:",
        error
      );

    }finally{

      window.location.replace(
        "login.html"
      );

    }
  },


  /* ==========================================================================
     LIVE USER CHROME
     ========================================================================== */

  async hydrateUserChrome(){

    try{

      if(
        !window.IGCA_API ||
        typeof window.IGCA_API.profile !== "function"
      ){

        console.warn(
          "IGCA: IGCA_API.profile() unavailable."
        );

        return null;
      }


      const profile =
        await window.IGCA_API.profile();


      if(!profile){
        return null;
      }


      const name =
        profile.full_name ||
        profile.username ||
        "IGCA Member";


      const role =
        profile.headline ||
        profile.account_type ||
        "Professional";


      /* USER NAME */

      document
        .querySelectorAll("[data-user-name]")
        .forEach(element => {

          element.textContent =
            name;

        });


      /* USER ROLE */

      document
        .querySelectorAll("[data-user-role]")
        .forEach(element => {

          element.textContent =
            role;

        });


      /* USER AVATAR */

      document
        .querySelectorAll("[data-user-avatar]")
        .forEach(element => {

          const avatar =
            profile.avatar_url;


          if(avatar){

            const safeAvatar =
              String(avatar)
                .replace(/"/g, "&quot;");


            const safeName =
              String(name)
                .replace(/"/g, "&quot;");


            element.innerHTML = `

              <img
                src="${safeAvatar}"
                alt="${safeName}"
                style="
                  width:100%;
                  height:100%;
                  object-fit:cover;
                  border-radius:inherit;
                  display:block;
                "
              >

            `;


            const image =
              element.querySelector("img");


            if(image){

              image.addEventListener(
                "error",
                () => {

                  element.innerHTML =
                    App.initials(name);

                },
                {
                  once:true
                }
              );

            }

          }else{

            element.textContent =
              App.initials(name);

          }

        });


      return profile;

    }catch(error){

      console.warn(
        "IGCA: Could not load live profile:",
        error
      );

      return null;
    }
  },


  /* ==========================================================================
     SHELL MOUNT
  ========================================================================== */

  mountShell(active){

    const sidebar =
      document.querySelector(
        ".app-sidebar"
      );

    const header =
      document.querySelector(
        ".app-header"
      );

    const bottomNav =
      document.querySelector(
        ".bottom-nav"
      );


    if(sidebar){

      sidebar.innerHTML =
        App.sidebarHTML(active);

    }


    if(header){

      header.innerHTML =
        App.headerHTML();

    }


    if(bottomNav){

      bottomNav.innerHTML =
        App.bottomNavHTML(active);

    }


    App.setActiveNav();

    App.initHeader();

    return true;
  }

};


/* ==========================================================================
   PUBLIC PAGES
   ========================================================================== */

const PUBLIC_PAGES = [
  "",
  "index.html",
  "login.html",
  "signup.html"
];


/* ==========================================================================
   GET CURRENT PAGE
   ========================================================================== */

function getCurrentPage(){

  return (
    location.pathname
      .split("/")
      .pop()
      .toLowerCase() ||
    "index.html"
  );
}


/* ==========================================================================
   SUPABASE READY CHECK
   ========================================================================== */

function isSupabaseReady(){

  return !!(
    window.sb &&
    window.sb.auth &&
    typeof window.sb.auth.getSession === "function"
  );
}


/* ==========================================================================
   AUTH GUARD
   ========================================================================== */

async function runAuthGuard(){

  try{

    const page =
      getCurrentPage();


    const isPublic =
      PUBLIC_PAGES.includes(page);


    /*
      Supabase normally loads before this file.
      If it isn't available, don't redirect blindly.
    */

    if(!isSupabaseReady()){

      console.warn(
        "IGCA: Supabase auth is not ready."
      );

      return {
        session:null,
        isPublic
      };
    }


    const {
      data,
      error
    } =
      await window.sb.auth.getSession();


    if(error){

      console.error(
        "IGCA: Failed to get session:",
        error
      );

      return {
        session:null,
        isPublic
      };
    }


    const session =
      data?.session || null;


    /* --------------------------------------------------------------
       NOT LOGGED IN
    -------------------------------------------------------------- */

    if(!session && !isPublic){

      window.location.replace(
        "login.html"
      );

      return {
        session:null,
        isPublic,
        redirected:true
      };
    }


    /* --------------------------------------------------------------
       LOGGED IN USER ON LOGIN/SIGNUP
    -------------------------------------------------------------- */

    if(
      session &&
      (
        page === "login.html" ||
        page === "signup.html"
      )
    ){

      window.location.replace(
        "dashboard.html"
      );

      return {
        session,
        isPublic,
        redirected:true
      };
    }


    return {
      session,
      isPublic,
      redirected:false
    };

  }catch(error){

    console.error(
      "IGCA: Auth guard error:",
      error
    );

    return {
      session:null,
      isPublic:false,
      error
    };
  }
}


/* ==========================================================================
   SUPABASE AUTH STATE LISTENER
   ========================================================================== */

function initAuthListener(){

  if(!isSupabaseReady()){
    return;
  }


  /*
    Keep UI synchronized if the user:
    - logs in
    - logs out
    - session expires
    - refreshes token
  */

  window.sb.auth.onAuthStateChange(
    (event, session) => {

      const page =
        getCurrentPage();


      if(
        event === "SIGNED_OUT" &&
        !PUBLIC_PAGES.includes(page)
      ){

        window.location.replace(
          "login.html"
        );

        return;
      }


      if(
        session &&
        (
          page === "login.html" ||
          page === "signup.html"
        )
      ){

        window.location.replace(
          "dashboard.html"
        );

      }

    }
  );
}


/* ==========================================================================
   GLOBAL INITIALIZATION
   ========================================================================== */

async function initializeIGCA(){

  const page =
    getCurrentPage();


  /*
    First make sure authentication state is valid.
  */

  const auth =
    await runAuthGuard();


  /*
    If auth guard already redirected,
    stop everything else.
  */

  if(auth?.redirected){
    return;
  }


  /*
    Public page.
    No sidebar/header shell.
  */

  if(
    !auth?.session ||
    auth?.isPublic
  ){

    return;
  }


  /*
    Authenticated application page.
  */

  App.mountShell(page);


  /*
    Load actual logged-in profile
    from Supabase/API.
  */

  await App.hydrateUserChrome();


  /*
    Initialize auth state listener
    after successful authenticated mount.
  */

  initAuthListener();

}


/* ==========================================================================
   DOM READY
   ========================================================================== */

if(
  document.readyState === "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    initializeIGCA,
    {
      once:true
    }
  );

}else{

  initializeIGCA();

}