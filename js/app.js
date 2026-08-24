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

"use strict";


/* ==========================================================================
   NETWORK GRAPHICS
   ========================================================================== */

const NetGraphics = {

  nodesThumb() {

    return `
      <svg
        viewBox="0 0 300 120"
        preserveAspectRatio="xMidYMid slice"
        style="
          width:100%;
          height:100%;
          background:var(--surface-secondary);
        "
        aria-hidden="true"
      >

        <line
          x1="40"
          y1="70"
          x2="120"
          y2="30"
          stroke="var(--border-strong)"
          stroke-width="1"
        />

        <line
          x1="120"
          y1="30"
          x2="210"
          y2="60"
          stroke="var(--border-strong)"
          stroke-width="1"
        />

        <line
          x1="120"
          y1="30"
          x2="150"
          y2="95"
          stroke="var(--border-strong)"
          stroke-width="1"
        />

        <line
          x1="210"
          y1="60"
          x2="270"
          y2="25"
          stroke="var(--border-strong)"
          stroke-width="1"
        />

        <circle
          class="net-node"
          cx="40"
          cy="70"
          r="4"
          fill="var(--accent)"
        />

        <circle
          class="net-node n2"
          cx="120"
          cy="30"
          r="5"
          fill="var(--primary)"
        />

        <circle
          class="net-node n3"
          cx="210"
          cy="60"
          r="4"
          fill="var(--accent)"
        />

        <circle
          class="net-node n4 slow"
          cx="150"
          cy="95"
          r="3.5"
          fill="var(--primary-tint)"
        />

        <circle
          class="net-node n5 slow"
          cx="270"
          cy="25"
          r="3.5"
          fill="var(--accent)"
        />

      </svg>
    `;
  },


  constellationRule() {

    return `
      <svg
        viewBox="0 0 600 24"
        preserveAspectRatio="none"
        style="width:100%;height:24px;"
        aria-hidden="true"
      >

        <line
          x1="0"
          y1="12"
          x2="600"
          y2="12"
          stroke="var(--border)"
          stroke-width="1"
        />

        <circle
          cx="30"
          cy="12"
          r="3"
          fill="var(--accent)"
        />

        <circle
          cx="180"
          cy="12"
          r="3"
          fill="var(--border-strong)"
        />

        <circle
          cx="330"
          cy="12"
          r="3"
          fill="var(--accent)"
        />

        <circle
          cx="480"
          cy="12"
          r="3"
          fill="var(--border-strong)"
        />

        <circle
          cx="570"
          cy="12"
          r="3"
          fill="var(--accent)"
        />

      </svg>
    `;
  }

};


/* ==========================================================================
   APP
   ========================================================================== */

const App = {


  /* ==========================================================================
     HELPERS
     ========================================================================== */

  escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },


  escapeAttribute(value) {

    return this.escapeHTML(value);
  },


  initials(name) {

    const value = String(name || "IG").trim();

    if (!value) {
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


  avatarHTML(name, size = "") {

    return `
      <div class="avatar ${this.escapeHTML(size)}">
        ${this.escapeHTML(this.initials(name))}
      </div>
    `;
  },


  emptyState(title, body) {

    return `
      <div class="empty-state">

        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          style="
            color:var(--border-strong);
            margin:0 auto;
          "
          aria-hidden="true"
        >

          <circle
            cx="12"
            cy="8"
            r="4"
          />

          <path
            d="M4 21c0-4 4-6 8-6s8 2 8 6"
          />

        </svg>

        <h3>${this.escapeHTML(title || "")}</h3>

        <p>${this.escapeHTML(body || "")}</p>

      </div>
    `;
  },


  verifyBadgeHTML() {

    return `
      <span
        class="verify-badge"
        title="Verified professional"
      >

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >

          <path
            d="
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
            "
          />

          <path d="M9 12l2 2 4-4" />

        </svg>

        Verified

      </span>
    `;
  },


  chipRow(items = []) {

    if (!Array.isArray(items) || !items.length) {
      return "";
    }

    return `
      <div class="chip-row">

        ${items
          .filter(Boolean)
          .map(item => `
            <span class="chip">
              ${this.escapeHTML(item)}
            </span>
          `)
          .join("")}

      </div>
    `;
  },


  /* ==========================================================================
     CARDS
     ========================================================================== */

  personCardHTML(p = {}) {

    const name = this.escapeHTML(p.name || "");
    const title = this.escapeHTML(p.title || "");
    const company = this.escapeHTML(p.company || "");
    const location = this.escapeHTML(p.location || "");
    const id = this.escapeAttribute(p.id || "");

    return `
      <div class="profile-card reveal">

        <div class="profile-card-top">

          ${this.avatarHTML(p.name)}

          <div>

            <div class="profile-name-row">

              <h3>${name}</h3>

            </div>

            <div class="title">
              ${title}
            </div>

            <div class="meta">

              ${
                company
                  ? `<span>${company}</span>`
                  : ""
              }

              ${
                location
                  ? ` · <span>${location}</span>`
                  : ""
              }

              ${
                p.verified
                  ? this.verifyBadgeHTML()
                  : ""
              }

            </div>

          </div>

        </div>

        ${this.chipRow(
          Array.isArray(p.expertise)
            ? p.expertise.slice(0, 3)
            : []
        )}

        <div class="meta">
          ${this.escapeHTML(p.mutual || 0)}
          mutual connections
        </div>

        <div class="profile-card-actions">

          <a
            class="btn btn-outline"
            href="profile.html?id=${encodeURIComponent(
              p.id || ""
            )}"
          >
            View Profile
          </a>

          <button
            class="btn btn-primary"
            type="button"
          >
            Connect
          </button>

        </div>

      </div>
    `;
  },


  companyCardHTML(c = {}) {

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
            "
          >
            ${this.escapeHTML(this.initials(c.name))}
          </div>

          <div>

            <h3>
              ${this.escapeHTML(c.name || "")}
            </h3>

            <div class="title">
              ${this.escapeHTML(c.type || "")}
            </div>

            <div class="meta">

              ${
                c.location
                  ? `<span>${this.escapeHTML(c.location)}</span>`
                  : ""
              }

              ${
                c.aum
                  ? ` · <span>${this.escapeHTML(c.aum)}</span>`
                  : ""
              }

            </div>

          </div>

        </div>

        ${this.chipRow(c.focus || [])}

        <div class="profile-card-actions">

          <a
            class="btn btn-outline"
            href="company.html?id=${encodeURIComponent(
              c.id || ""
            )}"
          >
            View Company
          </a>

          <button
            class="btn btn-primary"
            type="button"
          >
            Follow
          </button>

        </div>

      </div>
    `;
  },


  opportunityCardHTML(o = {}) {

    return `
      <div class="card card-pad reveal">

        ${
          o.sector
            ? `
              <span class="badge badge-neutral">
                ${this.escapeHTML(o.sector)}
              </span>
            `
            : ""
        }

        <h3
          style="
            margin-top:10px;
            font-size:15.5px;
          "
        >
          ${this.escapeHTML(o.title || "")}
        </h3>

        <p
          class="text-secondary"
          style="
            font-size:13.5px;
            margin-top:6px;
          "
        >
          ${this.escapeHTML(o.detail || "")}
        </p>

        ${
          o.stage
            ? `
              <div
                class="meta"
                style="margin-top:12px;"
              >
                ${this.escapeHTML(o.stage)}
              </div>
            `
            : ""
        }

      </div>
    `;
  },


  articleCardHTML(a = {}) {

    return `
      <div class="article-card reveal">

        <div class="article-thumb">
          ${NetGraphics.nodesThumb()}
        </div>

        <div class="body">

          <div class="cat">
            ${this.escapeHTML(a.cat || "")}
          </div>

          <h3>
            ${this.escapeHTML(a.title || "")}
          </h3>

          <div class="article-meta">

            <span>
              ${this.escapeHTML(a.author || "")}
            </span>

            <span>
              ${this.escapeHTML(a.read || "")}
            </span>

          </div>

        </div>

      </div>
    `;
  },


  learnCardHTML(a = {}) {

    return `
      <div
        class="card card-pad reveal"
        style="
          display:flex;
          flex-direction:column;
          gap:8px;
        "
      >

        <div
          class="cat"
          style="
            font-family:var(--font-mono);
            font-size:11px;
            text-transform:uppercase;
            color:var(--accent);
            letter-spacing:.06em;
          "
        >
          ${this.escapeHTML(a.cat || "")}
        </div>

        <h3
          style="
            font-size:15px;
            line-height:1.4;
          "
        >
          ${this.escapeHTML(a.title || "")}
        </h3>

        <div class="article-meta">

          <span>
            ${this.escapeHTML(a.author || "")}
          </span>

          <span>
            ${this.escapeHTML(a.read || "")}
          </span>

        </div>

        <button
          class="btn btn-ghost btn-sm"
          type="button"
          style="
            align-self:flex-start;
            padding-left:0;
          "
        >
          Save for later
        </button>

      </div>
    `;
  },


  /* ==========================================================================
     MOBILE NAV
     ========================================================================== */

  toggleMobileNav() {

    const sidebar =
      document.querySelector(".app-sidebar");

    if (!sidebar) {
      return;
    }

    sidebar.classList.toggle("open");
  },


  closeMobileNav() {

    const sidebar =
      document.querySelector(".app-sidebar");

    if (sidebar) {
      sidebar.classList.remove("open");
    }
  },


  /* ==========================================================================
     ACTIVE NAV
     ========================================================================== */

  setActiveNav() {

    const currentPage =
      getCurrentPage();

    document
      .querySelectorAll(
        ".nav-link, .bottom-nav a"
      )
      .forEach(link => {

        const href =
          link.getAttribute("href");

        if (!href) {
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

  initHeader() {

    return true;
  },


  headerHTML() {

    return `
      <!-- MOBILE MENU -->

      <button
        class="hamburger btn-ghost btn-icon"
        type="button"
        onclick="App.toggleMobileNav()"
        aria-label="Open menu"
      >

        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >

          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />

        </svg>

      </button>


      <!-- IGCA BRAND TITLE -->

      <div class="header-brand-title">
        INDO GULF CAPITAL ALLIANCE
      </div>


      <!-- HEADER ACTIONS -->

      <div
        class="header-actions"
        style="
          display:flex;
          gap:6px;
          align-items:center;
        "
      >

        <!-- Notifications -->

        <a
          class="header-icon-btn"
          href="notifications.html"
          aria-label="Notifications"
        >

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >

            <path
              d="
                M18 8
                a6 6 0 10-12 0
                c0 4-2 5-2 6
                h16
                c0-1-2-2-2-6z
              "
            />

            <path d="M10 20a2 2 0 004 0" />

          </svg>

          <span class="dot-flag"></span>

        </a>


        <!-- Messages -->

        <a
          class="header-icon-btn"
          href="messages.html"
          aria-label="Messages"
        >

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >

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
              "
            />

          </svg>

        </a>


        <!-- Profile -->

        <a
          class="sidebar-profile"
          href="profile.html"
          style="padding:4px;"
          data-user-chrome
        >

          <div
            class="avatar avatar-sm"
            data-user-avatar
          >
            ••
          </div>

        </a>


        <!-- Logout -->

        <button
          class="header-icon-btn"
          type="button"
          onclick="App.logout()"
          aria-label="Log out"
          title="Log out"
        >

          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >

            <path
              d="
                M9 21H5
                a2 2 0 01-2-2
                V5
                a2 2 0 012-2
                h4
              "
            />

            <path d="M16 17l5-5-5-5" />

            <path d="M21 12H9" />

          </svg>

        </button>

      </div>
    `;
  },


  /* ==========================================================================
     SIDEBAR
     ========================================================================== */

  sidebarHTML(active) {

    const link = (
      href,
      label,
      icon
    ) => {

      const currentPage =
        getCurrentPage();

      const isActive =
        active === href ||
        (
          !active &&
          currentPage === href.toLowerCase()
        );

      return `
        <a
          class="nav-link${isActive ? " active" : ""}"
          href="${href}"
        >

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
          stroke-width="2"
          aria-hidden="true"
        >

          <rect
            x="3"
            y="3"
            width="7"
            height="9"
            rx="1.5"
          />

          <rect
            x="14"
            y="3"
            width="7"
            height="5"
            rx="1.5"
          />

          <rect
            x="14"
            y="12"
            width="7"
            height="9"
            rx="1.5"
          />

          <rect
            x="3"
            y="16"
            width="7"
            height="5"
            rx="1.5"
          />

        </svg>
      `,


      discover: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >

          <circle
            cx="11"
            cy="11"
            r="7"
          />

          <path d="M21 21l-4.3-4.3" />

        </svg>
      `,


      network: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >

          <circle
            cx="12"
            cy="5"
            r="2.5"
          />

          <circle
            cx="5"
            cy="19"
            r="2.5"
          />

          <circle
            cx="19"
            cy="19"
            r="2.5"
          />

          <path d="M12 7.5V14" />
          <path d="M12 14L6.5 17" />
          <path d="M12 14l5.5 3" />

        </svg>
      `,


      messages: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >

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
            "
          />

        </svg>
      `,


      appointments: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >

          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
          />

          <path d="M16 3v4" />
          <path d="M8 3v4" />
          <path d="M3 10h18" />

        </svg>
      `,


      learn: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >

          <path d="M2 6l10-4 10 4-10 4-10-4z" />

          <path
            d="
              M6 10v6
              c0 1.5 2.5 3 6 3
              s6-1.5 6-3v-6
            "
          />

        </svg>
      `,


      ai: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >

          <rect
            x="4"
            y="7"
            width="16"
            height="12"
            rx="2"
          />

          <path d="M9 3v4" />
          <path d="M15 3v4" />

          <path d="M9 13h.01" />
          <path d="M15 13h.01" />

        </svg>
      `,


      notif: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >

          <path
            d="
              M18 8
              a6 6 0 10-12 0
              c0 4-2 5-2 6
              h16
              c0-1-2-2-2-6z
            "
          />

          <path d="M10 20a2 2 0 004 0" />

        </svg>
      `,


      settings: `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >

          <circle
            cx="12"
            cy="12"
            r="3"
          />

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
              1.7 1.7 0 001.5 1H21
              a2 2 0 110 4
              h-.2
              a1.7 1.7 0 00-1.4.9z
            "
          />

        </svg>
      `
    };


    return `

      <!-- BRAND -->

      <div class="brand">

        <svg
          class="brand-mark"
          viewBox="0 0 30 30"
          fill="none"
          aria-hidden="true"
        >

          <circle
            cx="15"
            cy="6"
            r="3"
            fill="#AD8A4D"
          />

          <circle
            cx="6"
            cy="20"
            r="3"
            fill="#fff"
          />

          <circle
            cx="24"
            cy="20"
            r="3"
            fill="#fff"
          />

          <circle
            cx="15"
            cy="27"
            r="2.4"
            fill="#AD8A4D"
          />

          <path
            d="
              M15 6L6 20
              M15 6L24 20
              M6 20L15 27
              M24 20L15 27
            "
            stroke="rgba(255,255,255,.3)"
            stroke-width="1.2"
          />

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
          data-user-chrome
        >

          <div
            class="avatar avatar-sm"
            data-user-avatar
          >
            ••
          </div>

          <div class="sidebar-profile-info">

            <div
              class="name"
              data-user-name
            >
              Loading…
            </div>

            <div
              class="role"
              data-user-role
            ></div>

          </div>

        </a>

      </div>
    `;
  },


  /* ==========================================================================
     BOTTOM NAVIGATION
     ========================================================================== */

  bottomNavHTML(active) {

    const link = (
      href,
      label,
      icon
    ) => {

      const currentPage =
        getCurrentPage();

      const isActive =
        active === href ||
        currentPage === href.toLowerCase();

      return `
        <a
          class="${isActive ? "active" : ""}"
          href="${href}"
        >

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
            stroke-width="2"
            aria-hidden="true"
          >

            <path d="M3 11l9-7 9 7" />

            <path
              d="M5 10v10h14V10"
            />

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
            stroke-width="2"
            aria-hidden="true"
          >

            <circle
              cx="11"
              cy="11"
              r="7"
            />

            <path
              d="M21 21l-4.3-4.3"
            />

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
            stroke-width="2"
            aria-hidden="true"
          >

            <circle
              cx="12"
              cy="5"
              r="2.5"
            />

            <circle
              cx="5"
              cy="19"
              r="2.5"
            />

            <circle
              cx="19"
              cy="19"
              r="2.5"
            />

            <path d="M12 7.5V14" />
            <path d="M12 14L6.5 17" />
            <path d="M12 14l5.5 3" />

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
            stroke-width="2"
            aria-hidden="true"
          >

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
              "
            />

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
            stroke-width="2"
            aria-hidden="true"
          >

            <circle
              cx="12"
              cy="8"
              r="4"
            />

            <path
              d="
                M4 21
                v-1
                a8 8 0 0116 0
                v1
              "
            />

          </svg>
        `
      )}

    `;
  },


  /* ==========================================================================
     LOGOUT
     ========================================================================== */

  async logout() {

    try {

      if (
        window.sb &&
        window.sb.auth &&
        typeof window.sb.auth.signOut === "function"
      ) {

        await window.sb.auth.signOut();
      }

    } catch (error) {

      console.warn(
        "IGCA: Logout error:",
        error
      );

    } finally {

      window.location.replace(
        "login.html"
      );
    }
  },


  /* ==========================================================================
     LIVE USER CHROME
     ========================================================================== */

  async hydrateUserChrome() {

    try {

      if (
        !window.IGCA_API ||
        typeof window.IGCA_API.profile !== "function"
      ) {

        console.warn(
          "IGCA: IGCA_API.profile() unavailable."
        );

        return null;
      }


      const profile =
        await window.IGCA_API.profile();


      if (!profile) {
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


          if (avatar) {

            const safeAvatar =
              this.escapeAttribute(avatar);

            const safeName =
              this.escapeAttribute(name);


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


            if (image) {

              image.addEventListener(
                "error",
                () => {

                  element.innerHTML =
                    this.escapeHTML(
                      this.initials(name)
                    );

                },
                {
                  once: true
                }
              );
            }

          } else {

            element.textContent =
              this.initials(name);
          }
        });


      return profile;

    } catch (error) {

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

  mountShell(active) {

    try {

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


      if (sidebar) {

        sidebar.innerHTML =
          this.sidebarHTML(active);
      }


      if (header) {

        header.innerHTML =
          this.headerHTML();
      }


      if (bottomNav) {

        bottomNav.innerHTML =
          this.bottomNavHTML(active);
      }


      this.setActiveNav();

      this.initHeader();


      /* Close mobile menu when navigating */

      document
        .querySelectorAll(
          ".app-sidebar a"
        )
        .forEach(link => {

          link.addEventListener(
            "click",
            () => {

              this.closeMobileNav();
            }
          );

        });


      return true;

    } catch (error) {

      console.error(
        "IGCA: Shell mount failed:",
        error
      );

      return false;
    }
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

function getCurrentPage() {

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

function isSupabaseReady() {

  return !!(
    window.sb &&
    window.sb.auth &&
    typeof window.sb.auth.getSession === "function"
  );
}


/* ==========================================================================
   AUTH GUARD
   ========================================================================== */

async function runAuthGuard() {

  try {

    const page =
      getCurrentPage();


    const isPublic =
      PUBLIC_PAGES.includes(page);


    /*
      Supabase normally loads before this file.

      If it is not available, do NOT redirect blindly.
    */

    if (!isSupabaseReady()) {

      console.warn(
        "IGCA: Supabase auth is not ready."
      );

      return {
        session: null,
        isPublic: isPublic,
        redirected: false
      };
    }


    const result =
      await window.sb.auth.getSession();


    const data =
      result?.data || null;

    const error =
      result?.error || null;


    if (error) {

      console.error(
        "IGCA: Failed to get session:",
        error
      );

      return {
        session: null,
        isPublic: isPublic,
        redirected: false,
        error: error
      };
    }


    const session =
      data?.session || null;


    /* ----------------------------------------------------------------------
       NOT LOGGED IN
       ---------------------------------------------------------------------- */

    if (
      !session &&
      !isPublic
    ) {

      window.location.replace(
        "login.html"
      );

      return {
        session: null,
        isPublic: isPublic,
        redirected: true
      };
    }


    /* ----------------------------------------------------------------------
       LOGGED IN USER ON LOGIN / SIGNUP
       ---------------------------------------------------------------------- */

    if (
      session &&
      (
        page === "login.html" ||
        page === "signup.html"
      )
    ) {

      window.location.replace(
        "dashboard.html"
      );

      return {
        session: session,
        isPublic: isPublic,
        redirected: true
      };
    }


    return {
      session: session,
      isPublic: isPublic,
      redirected: false
    };


  } catch (error) {

    console.error(
      "IGCA: Auth guard error:",
      error
    );

    return {
      session: null,
      isPublic: false,
      redirected: false,
      error: error
    };
  }
}


/* ==========================================================================
   SUPABASE AUTH STATE LISTENER
   ========================================================================== */

function initAuthListener() {

  if (!isSupabaseReady()) {
    return;
  }


  try {

    window.sb.auth.onAuthStateChange(
      (event, session) => {

        const page =
          getCurrentPage();


        /* SIGNED OUT */

        if (
          event === "SIGNED_OUT" &&
          !PUBLIC_PAGES.includes(page)
        ) {

          window.location.replace(
            "login.html"
          );

          return;
        }


        /* LOGGED IN ON LOGIN / SIGNUP */

        if (
          session &&
          (
            page === "login.html" ||
            page === "signup.html"
          )
        ) {

          window.location.replace(
            "dashboard.html"
          );
        }

      }
    );

  } catch (error) {

    console.warn(
      "IGCA: Auth listener could not be initialized:",
      error
    );
  }
}


/* ==========================================================================
   GLOBAL INITIALIZATION
   ========================================================================== */

async function initializeIGCA() {

  try {

    const page =
      getCurrentPage();


    /*
      First validate authentication.
    */

    const auth =
      await runAuthGuard();


    /*
      If auth guard already redirected,
      stop everything else.
    */

    if (auth?.redirected) {
      return;
    }


    /*
      Public page.
      No application shell.
    */

    if (
      !auth?.session ||
      auth?.isPublic
    ) {

      return;
    }


    /*
      Authenticated application page.
    */

    App.mountShell(page);


    /*
      Load actual logged-in profile.
    */

    await App.hydrateUserChrome();


    /*
      Keep auth state synchronized.
    */

    initAuthListener();


  } catch (error) {

    console.error(
      "IGCA: Initialization failed:",
      error
    );
  }
}


/* ==========================================================================
   DOM READY
   ========================================================================== */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeIGCA,
    {
      once: true
    }
  );

} else {

  initializeIGCA();
}


/* ==========================================================================
   IGCA — RESPONSIVE SIDEBAR
   Global Shell Navigation
   ========================================================================== */

(function () {

  "use strict";


  function initResponsiveSidebar() {

    const sidebar =
      document.querySelector(".app-sidebar");

    const header =
      document.querySelector(".app-header");

    if (!sidebar || !header) {
      return;
    }


    /* ----------------------------------------------------------------------
       Prevent duplicate initialization
       ---------------------------------------------------------------------- */

    if (
      document.body.dataset.sidebarReady === "true"
    ) {
      return;
    }

    document.body.dataset.sidebarReady = "true";


    /* ----------------------------------------------------------------------
       CREATE OVERLAY
       ---------------------------------------------------------------------- */

    let overlay =
      document.querySelector(".sidebar-overlay");

    if (!overlay) {

      overlay =
        document.createElement("div");

      overlay.className =
        "sidebar-overlay";

      overlay.setAttribute(
        "aria-hidden",
        "true"
      );

      document.body.appendChild(
        overlay
      );
    }


    /* ----------------------------------------------------------------------
       CREATE HAMBURGER
       ---------------------------------------------------------------------- */

    let hamburger =
      document.querySelector(".hamburger");

    if (!hamburger) {

      hamburger =
        document.createElement("button");

      hamburger.type =
        "button";

      hamburger.className =
        "hamburger";

      hamburger.setAttribute(
        "aria-label",
        "Open navigation"
      );

      hamburger.setAttribute(
        "aria-expanded",
        "false"
      );

      hamburger.innerHTML = `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M4 6h16"/>
          <path d="M4 12h16"/>
          <path d="M4 18h16"/>
        </svg>
      `;

      /*
       * Put hamburger at the beginning of header.
       */

      header.insertBefore(
        hamburger,
        header.firstChild
      );
    }


    /* ----------------------------------------------------------------------
       CREATE SIDEBAR CLOSE BUTTON
       ---------------------------------------------------------------------- */

    let closeButton =
      sidebar.querySelector(
        ".sidebar-close-btn"
      );

    if (!closeButton) {

      closeButton =
        document.createElement("button");

      closeButton.type =
        "button";

      closeButton.className =
        "sidebar-close-btn";

      closeButton.setAttribute(
        "aria-label",
        "Close navigation"
      );

      closeButton.innerHTML = `
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M6 6l12 12"/>
          <path d="M18 6L6 18"/>
        </svg>
      `;

      sidebar.appendChild(
        closeButton
      );
    }


    /* ----------------------------------------------------------------------
       OPEN
       ---------------------------------------------------------------------- */

    function openSidebar() {

      /*
       * Only drawer behavior on mobile.
       */

      if (
        window.innerWidth > 700
      ) {
        return;
      }

      document.body.classList.add(
        "sidebar-open"
      );

      overlay.classList.add(
        "active"
      );

      overlay.setAttribute(
        "aria-hidden",
        "false"
      );

      hamburger.setAttribute(
        "aria-expanded",
        "true"
      );

      hamburger.setAttribute(
        "aria-label",
        "Close navigation"
      );
    }


    /* ----------------------------------------------------------------------
       CLOSE
       ---------------------------------------------------------------------- */

    function closeSidebar() {

      document.body.classList.remove(
        "sidebar-open"
      );

      overlay.classList.remove(
        "active"
      );

      overlay.setAttribute(
        "aria-hidden",
        "true"
      );

      hamburger.setAttribute(
        "aria-expanded",
        "false"
      );

      hamburger.setAttribute(
        "aria-label",
        "Open navigation"
      );
    }


    /* ----------------------------------------------------------------------
       TOGGLE
       ---------------------------------------------------------------------- */

    function toggleSidebar() {

      if (
        document.body.classList.contains(
          "sidebar-open"
        )
      ) {

        closeSidebar();

      } else {

        openSidebar();

      }
    }


    /* ----------------------------------------------------------------------
       EVENTS
       ---------------------------------------------------------------------- */

    hamburger.addEventListener(
      "click",
      toggleSidebar
    );


    closeButton.addEventListener(
      "click",
      closeSidebar
    );


    overlay.addEventListener(
      "click",
      closeSidebar
    );


    /* ----------------------------------------------------------------------
       ESCAPE
       ---------------------------------------------------------------------- */

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Escape"
        ) {

          closeSidebar();

        }

      }
    );


    /* ----------------------------------------------------------------------
       NAV LINK CLICK
       Mobile drawer automatically closes.
       ---------------------------------------------------------------------- */

    sidebar.addEventListener(
      "click",
      event => {

        const link =
          event.target.closest(
            ".nav-link"
          );

        if (!link) {
          return;
        }

        if (
          window.innerWidth <= 700
        ) {

          closeSidebar();

        }

      }
    );


    /* ----------------------------------------------------------------------
       RESIZE
       ---------------------------------------------------------------------- */

    let resizeTimer = null;

    window.addEventListener(
      "resize",
      () => {

        clearTimeout(
          resizeTimer
        );

        resizeTimer =
          setTimeout(
            () => {

              /*
               * Desktop/tablet:
               * remove mobile drawer state.
               */

              if (
                window.innerWidth > 700
              ) {

                closeSidebar();

              }

            },
            100
          );

      }
    );


    console.log(
      "IGCA Responsive Sidebar: initialized"
    );
  }


  /* ------------------------------------------------------------------------
     DOM READY
     ------------------------------------------------------------------------ */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initResponsiveSidebar
    );

  } else {

    initResponsiveSidebar();

  }

})();


/* ==========================================================================
   GLOBAL EXPORTS
   ========================================================================== */

window.NetGraphics =
  NetGraphics;

window.App =
  App;

window.PUBLIC_PAGES =
  PUBLIC_PAGES;

window.getCurrentPage =
  getCurrentPage;

window.isSupabaseReady =
  isSupabaseReady;

window.runAuthGuard =
  runAuthGuard;

window.initAuthListener =
  initAuthListener;

window.initializeIGCA =
  initializeIGCA;
