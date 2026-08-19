/* ==========================================================================
   IGCA — Notifications
   Live Supabase Notifications
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  "use strict";

  App.mountShell("notifications.html");

  const list =
    document.getElementById("notif-list");

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
      <svg viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           stroke-width="2"
           stroke-linecap="round"
           stroke-linejoin="round">
        <circle cx="12" cy="8" r="4"></circle>
        <path d="M4 21v-1a8 8 0 0 1 16 0v1"></path>
      </svg>
    `,

    message: `
      <svg viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           stroke-width="2"
           stroke-linecap="round"
           stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `,

    opportunity: `
      <svg viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           stroke-width="2"
           stroke-linecap="round"
           stroke-linejoin="round">
        <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.3l-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z"></path>
      </svg>
    `,

    appointment: `
      <svg viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           stroke-width="2"
           stroke-linecap="round"
           stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2"></rect>
        <path d="M16 3v4"></path>
        <path d="M8 3v4"></path>
        <path d="M3 10h18"></path>
      </svg>
    `,

    activity: `
      <svg viewBox="0 0 24 24"
           fill="none"
           stroke="currentColor"
           stroke-width="2"
           stroke-linecap="round"
           stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 8v4l3 2"></path>
      </svg>
    `,

    
system: `
  <svg viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       stroke-width="2"
       stroke-linecap="round"
       stroke-linejoin="round">
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M12 8v4l3 2"></path>
  </svg>
`,

follow: `
  <svg viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       stroke-width="2"
       stroke-linecap="round"
       stroke-linejoin="round">
    <circle cx="9" cy="8" r="3"></circle>
    <path d="M3 21v-1a6 6 0 0 1 12 0v1"></path>
    <path d="M16 11h5"></path>
    <path d="M18.5 8.5v5"></path>
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

    if (!value) {
      return "";
    }

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
     RENDER
     ======================================================================== */

  function renderNotifications(notifications) {

    if (!Array.isArray(notifications)) {
      notifications = [];
    }


    if (!notifications.length) {

      list.innerHTML = `
        <div class="notifications-empty">
          <div class="notifications-empty-icon">
            ${getIcon("activity")}
          </div>

          <h3>No notifications yet</h3>

          <p>
            You're all caught up. New activity will appear here.
          </p>
        </div>
      `;

      updateMarkAllButton(0);

      return;
    }


    const unreadCount =
      notifications.filter(
        item => !item.read_at
      ).length;


    list.innerHTML =
      notifications.map(notification => {

        const unread =
          !notification.read_at;

        return `
          <article
            class="notif-item ${unread ? "notif-unread" : ""}"
            data-id="${escapeHTML(notification.id)}"
          >

            <div class="notif-icon">
              ${getIcon(notification.type)}
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

      }).join("");


    updateMarkAllButton(unreadCount);

    attachNotificationClicks();
  }


  /* ========================================================================
     MARK ALL BUTTON
     ======================================================================== */

  function updateMarkAllButton(unreadCount) {

    if (!markAllButton) {
      return;
    }

    markAllButton.disabled =
      unreadCount === 0;

    markAllButton.textContent =
      unreadCount > 0
        ? `Mark all as read (${unreadCount})`
        : "All notifications read";
  }


  /* ========================================================================
     LOAD
     ======================================================================== */

  async function loadNotifications() {

    list.innerHTML = `
      <div class="notifications-loading">
        <div class="loading-spinner"></div>

        <p>Loading notifications...</p>
      </div>
    `;

    try {

      const notifications =
        await IGCA_API.notifications();

      renderNotifications(
        notifications
      );

    } catch (error) {

      console.error(
        "IGCA Notifications Load Error:",
        error
      );

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
        .getElementById("retry-notifications")
        ?.addEventListener(
          "click",
          loadNotifications
        );
    }
  }


  /* ========================================================================
     CLICK → MARK READ
     ======================================================================== */

  function attachNotificationClicks() {

    document
      .querySelectorAll(".notif-item")
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

            if (!id) {
              return;
            }


            try {

              await IGCA_API.markNotificationRead(
                id
              );

              item.classList.remove(
                "notif-unread"
              );


              const dot =
                item.querySelector(
                  ".notif-unread-dot"
                );

              dot?.remove();


              const title =
                item.querySelector(
                  ".notif-title"
                );

              if (title) {
                title.style.fontWeight =
                  "500";
              }


              const unreadItems =
                document.querySelectorAll(
                  ".notif-item.notif-unread"
                ).length;

              updateMarkAllButton(
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
     MARK ALL
     ======================================================================== */

if (markAllButton) {

  markAllButton.addEventListener(
    "click",
    async () => {

      markAllButton.disabled = true;
      markAllButton.textContent = "Marking...";

      try {

        await IGCA_API.markAllNotificationsRead();

        await loadNotifications();

      } catch (error) {

        console.error(
          "Mark all notifications error:",
          error
        );

        alert(
          error.message ||
          "Unable to mark all notifications as read."
        );

      } finally {

        markAllButton.disabled = false;
        markAllButton.textContent =
          "Mark all as read";
      }
    }
  );
}

  /* ========================================================================
     INITIAL LOAD
     ======================================================================== */

  await loadNotifications();


  /* ========================================================================
     REALTIME
     ======================================================================== */

  let notificationChannel = null;

  try {

    notificationChannel =
      await IGCA_API.subscribeNotifications(
        async payload => {

          console.log(
            "IGCA new notification:",
            payload
          );


          /*
           * Reload from database instead of
           * blindly inserting payload into UI.
           * This keeps sorting and unread state correct.
           */

          await loadNotifications();


          /*
           * Optional browser notification.
           */

          if (
            document.hidden &&
            "Notification" in window &&
            Notification.permission === "granted"
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

  } catch (error) {

    console.error(
      "IGCA notification realtime error:",
      error
    );
  }


  /* ========================================================================
     CLEANUP
     ======================================================================== */

  window.addEventListener(
    "beforeunload",
    () => {

      if (notificationChannel) {

        IGCA_API
          .unsubscribeNotifications(
            notificationChannel
          );

      }

    }
  );

});