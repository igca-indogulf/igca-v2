/* ==========================================================================
   IGCA — Notifications
   Realtime Supabase Notifications
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";
  /* ========================================================================
     GLOBAL NOTIFICATION BELL
     ======================================================================== */

  async function refreshGlobalNotificationBell() {
    try {
      if (
        typeof IGCA_API === "undefined" ||
        typeof IGCA_API.unreadNotificationCount !== "function"
      ) {
        return;
      }

      const count =
        await IGCA_API.unreadNotificationCount();

      updateBellCount(count);

      console.log(
        "🔔 IGCA unread notification count:",
        count
      );

    } catch (error) {
      console.error(
        "IGCA global notification count error:",
        error
      );
    }
  }

  /* ========================================================================
     SHELL
     ======================================================================== */

  if (typeof App !== "undefined" && App.mountShell) {
    App.mountShell("notifications.html");
  }

  const list = document.getElementById("notif-list");
  const markAllButton =
    document.getElementById("mark-all-read");

  if (!list) {
    console.error(
      "IGCA Notifications: #notif-list not found."
    );
    return;
  }

  /* ========================================================================
     ICONS
     ======================================================================== */

  const icons = {
    connection: `
      <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <circle cx="12" cy="8" r="4"></circle>
        <path d="M4 21v-1a8 8 0 0 1 16 0v1"></path>
      </svg>
    `,

    follow: `
      <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <circle cx="9" cy="8" r="3"></circle>
        <path d="M3 21v-1a6 6 0 0 1 12 0v1"></path>
        <path d="M16 11h5"></path>
        <path d="M18.5 8.5v5"></path>
      </svg>
    `,

    like: `
      <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M20.8 8.7c0 5.5-8.8 10.3-8.8 10.3S3.2 14.2 3.2 8.7
        A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5z"></path>
      </svg>
    `,

    comment: `
      <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `,

    message: `
      <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `,

    activity: `
      <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 8v4l3 2"></path>
      </svg>
    `
  };

  /* ========================================================================
     HELPERS
     ======================================================================== */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function getIcon(type) {
    return icons[type] || icons.activity;
  }
  /* ========================================================================
     GLOBAL BELL COUNT
     ======================================================================== */

  async function loadGlobalBellCount() {
    try {
      if (
        typeof IGCA_API === "undefined" ||
        typeof IGCA_API.unreadNotificationCount !== "function"
      ) {
        return;
      }

      const count =
        await IGCA_API.unreadNotificationCount();

      updateBellCount(count);

      console.log(
        "IGCA global unread notification count:",
        count
      );

    } catch (error) {
      console.error(
        "IGCA global bell count error:",
        error
      );
    }
  }

  /* ========================================================================
     BELL COUNT
     ======================================================================== */

  function updateBellCount(count) {
    count = Number(count) || 0;

    const selectors = [
      "#notification-count",
      "#notification-badge",
      ".notification-count",
      ".notification-badge",
      "[data-notification-count]"
    ];

    const elements = document.querySelectorAll(
      selectors.join(",")
    );

    elements.forEach(element => {
      element.textContent =
        count > 99 ? "99+" : String(count);

      element.hidden = count <= 0;

      element.classList.toggle(
        "has-notifications",
        count > 0
      );
    });

    window.IGCA_NOTIFICATION_COUNT = count;

    window.dispatchEvent(
      new CustomEvent(
        "igca:notification-count",
        {
          detail: { count }
        }
      )
    );
  }

  /* ========================================================================
     MARK ALL BUTTON
     ======================================================================== */

  function updateMarkAllButton(unreadCount) {
    if (!markAllButton) return;

    unreadCount = Number(unreadCount) || 0;

    markAllButton.disabled =
      unreadCount === 0;

    markAllButton.textContent =
      unreadCount > 0
        ? `Mark all as read (${unreadCount})`
        : "All notifications read";
  }

  /* ========================================================================
     RENDER
     ======================================================================== */

  function renderNotifications(
    notifications
  ) {
    if (!Array.isArray(notifications)) {
      notifications = [];
    }

    console.log(
      "IGCA rendering notifications:",
      notifications.length
    );

    if (!notifications.length) {
      list.innerHTML = `
        <div class="notifications-empty">
          <div class="notifications-empty-icon">
            ${getIcon("activity")}
          </div>

          <h3>No notifications yet</h3>

          <p>
            You're all caught up.
            New activity will appear here.
          </p>
        </div>
      `;

      updateMarkAllButton(0);
      updateBellCount(0);

      return;
    }

   const unreadCount =
  notifications.filter(
    notification =>
      !notification.read_at
  ).length;

    list.innerHTML =
      notifications
        .map(notification => {
          const unread =
  !notification.read_at;

          return `
            <article
              class="notif-item ${
                unread
                  ? "notif-unread"
                  : ""
              }"
              data-id="${escapeHTML(
                notification.id
              )}"
            >

              <div class="notif-icon">
                ${getIcon(
                  notification.type
                )}
              </div>

              <div class="notif-content">

                <div class="notif-top">

                  <h3 class="notif-title">
                    ${escapeHTML(
                      notification.title ||
                      "Notification"
                    )}
                  </h3>

                  ${
                    unread
                      ? `
                        <span
                          class="notif-unread-dot"
                          aria-label="Unread"
                        ></span>
                      `
                      : ""
                  }

                </div>

                ${
                  notification.body
                    ? `
                      <p class="notif-body">
                        ${escapeHTML(
                          notification.body
                        )}
                      </p>
                    `
                    : ""
                }

                <div class="notif-bottom">

                  <time class="notif-time">
                    ${escapeHTML(
                      formatTime(
                        notification.created_at
                      )
                    )}
                  </time>

                  ${
                    notification.link
                      ? `
                        <a
                          href="${escapeHTML(
                            notification.link
                          )}"
                          class="notif-view"
                        >
                          View
                        </a>
                      `
                      : ""
                  }

                </div>

              </div>

            </article>
          `;
        })
        .join("");

    updateMarkAllButton(
      unreadCount
    );

    updateBellCount(
      unreadCount
    );

    attachNotificationClicks();
  }

  /* ========================================================================
     LOAD NOTIFICATIONS
     ======================================================================== */

  async function loadNotifications() {
    list.innerHTML = `
      <div class="notifications-loading">
        <div class="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    `;

    try {
      if (
        typeof IGCA_API === "undefined"
      ) {
        throw new Error(
          "IGCA_API is not available."
        );
      }

      if (
        typeof IGCA_API.notifications !==
        "function"
      ) {
        throw new Error(
          "IGCA_API.notifications() is not available."
        );
      }

      console.log(
        "IGCA notifications: loading..."
      );

      const notifications =
        await IGCA_API.notifications();

      console.log(
        "IGCA notifications loaded:",
        notifications
      );

      renderNotifications(
        notifications
      );

    } catch (error) {
      console.error(
        "IGCA Notifications Load Error:",
        error
      );

      updateMarkAllButton(0);
      updateBellCount(0);

      list.innerHTML = `
        <div class="notifications-error">

          <div class="notifications-error-icon">
            !
          </div>

          <h3>
            Unable to load notifications
          </h3>

          <p>
            ${escapeHTML(
              error?.message ||
              "Something went wrong."
            )}
          </p>

          <button
            type="button"
            class="btn btn-primary btn-sm"
            id="retry-notifications"
          >
            Try again
          </button>

        </div>
      `;

      document
        .getElementById(
          "retry-notifications"
        )
        ?.addEventListener(
          "click",
          loadNotifications
        );
    }
  }

  /* ========================================================================
     MARK ONE READ
     ======================================================================== */

  function attachNotificationClicks() {
    document
      .querySelectorAll(
        ".notif-item"
      )
      .forEach(item => {

        item.addEventListener(
          "click",
          async event => {

            if (
              event.target.closest("a") ||
              event.target.closest("button")
            ) {
              return;
            }

            if (
              !item.classList.contains(
                "notif-unread"
              )
            ) {
              return;
            }

            const id =
              item.dataset.id;

            if (!id) return;

            try {
              if (
                !IGCA_API.markNotificationRead
              ) {
                throw new Error(
                  "markNotificationRead() is not available."
                );
              }

              await
                IGCA_API.markNotificationRead(
                  id
                );

              item.classList.remove(
                "notif-unread"
              );

              item
                .querySelector(
                  ".notif-unread-dot"
                )
                ?.remove();

              const unreadItems =
                document.querySelectorAll(
                  ".notif-item.notif-unread"
                ).length;

              updateMarkAllButton(
                unreadItems
              );

              updateBellCount(
                unreadItems
              );

            } catch (error) {
              console.error(
                "Mark notification read error:",
                error
              );
            }
          }
        );
      });
  }

  /* ========================================================================
     MARK ALL READ
     ======================================================================== */

  if (markAllButton) {
    markAllButton.addEventListener(
      "click",
      async () => {

        try {
          markAllButton.disabled =
            true;

          markAllButton.textContent =
            "Marking...";

          if (
            !IGCA_API.markAllNotificationsRead
          ) {
            throw new Error(
              "markAllNotificationsRead() is not available."
            );
          }

          await
            IGCA_API.markAllNotificationsRead();

          await loadNotifications();
          

        } catch (error) {
          console.error(
            "Mark all notifications error:",
            error
          );

          alert(
            error?.message ||
            "Unable to mark all notifications as read."
          );

          markAllButton.disabled =
            false;
        }
      }
    );
  }

  /* ========================================================================
     REALTIME
     ======================================================================== */

  let notificationChannel =
    null;

  async function startRealtime() {
    try {
      if (
        typeof IGCA_API
          ?.subscribeNotifications !==
        "function"
      ) {
        console.warn(
          "IGCA subscribeNotifications() is not available."
        );

        return;
      }

      console.log(
        "IGCA notifications: starting realtime..."
      );

      notificationChannel =
        await
          IGCA_API.subscribeNotifications(
            async payload => {

              console.log(
                "IGCA NEW NOTIFICATION:",
                payload
              );

              /*
               * Reload from database so that
               * the page always shows the
               * latest notification state.
               */
              await loadNotifications();

              /*
               * Optional browser notification
               * when the page is hidden.
               */
              if (
                document.hidden &&
                "Notification" in window &&
                Notification.permission ===
                  "granted"
              ) {
                const notification =
                  payload?.new;

                if (notification) {
                  new Notification(
                    notification.title ||
                      "IGCA Notification",
                    {
                      body:
                        notification.body ||
                        ""
                    }
                  );
                }
              }
            }
          );

      console.log(
        "IGCA notifications realtime started:",
        notificationChannel
      );

    } catch (error) {
      console.error(
        "IGCA notification realtime error:",
        error
      );
    }
  }

  /* ========================================================================
     CLEANUP
     ======================================================================== */

  window.addEventListener(
    "beforeunload",
    () => {

      if (
        notificationChannel &&
        typeof IGCA_API
          ?.unsubscribeNotifications ===
          "function"
      ) {
        IGCA_API.unsubscribeNotifications(
          notificationChannel
        );
      }

    }
  );

  /* ========================================================================
     INITIAL LOAD
     ======================================================================== */

  await loadNotifications();
  await refreshGlobalNotificationBell();

  /* ========================================================================
     START REALTIME
     ======================================================================== */

  await startRealtime();

});
