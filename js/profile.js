/* ==========================================================================
   IGCA — PROFILE
   Live Supabase Profile
   Own Profile + Other Profile
   Connect / Message / Meeting / Notification
   ========================================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", initProfile);


/* ==========================================================================
   INIT
   ========================================================================== */

async function initProfile() {

  try {

    const page =
      location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    if (page === "company.html") {
      App.mountShell(null);
      return;
    }

    App.mountShell(null);

    const params =
      new URLSearchParams(location.search);

    const profileId =
      params.get("id");

    if (!profileId) {

      await loadOwnProfile();

      return;
    }

    await loadOtherProfile(profileId);

  } catch (error) {

    console.error(
      "Profile initialization error:",
      error
    );

    showProfileError();
  }
}


/* ==========================================================================
   OWN PROFILE
   ========================================================================== */

async function loadOwnProfile() {

  const ownActions =
    document.getElementById("own-profile-actions");

  const otherActions =
    document.getElementById("other-profile-actions");

  if (ownActions) {
    ownActions.style.display = "flex";
  }

  if (otherActions) {
    otherActions.style.display = "none";
  }

  try {

    if (
      !window.IGCA_API ||
      typeof IGCA_API.profile !== "function"
    ) {
      throw new Error("Profile API unavailable.");
    }

    const profile =
      await IGCA_API.profile();

    if (!profile) {
      throw new Error("Profile not found.");
    }

    renderProfile(profile);

  } catch (error) {

    console.error(
      "Own profile load error:",
      error
    );

    setText(
      "p-name",
      "Complete your profile"
    );

    setText("p-title", "");
    setText("p-meta", "");

    setText(
      "p-about",
      "Your profile information could not be loaded. Open Settings to complete your profile."
    );

    setText("p-exp-current", "—");

    const expertise =
      document.getElementById("p-expertise");

    if (expertise) {

      expertise.innerHTML =
        App.emptyState(
          "No expertise added yet",
          "Add your expertise from Settings."
        );
    }
  }
}


/* ==========================================================================
   OTHER PROFILE
   ========================================================================== */

async function loadOtherProfile(profileId) {

  const ownActions =
    document.getElementById("own-profile-actions");

  const otherActions =
    document.getElementById("other-profile-actions");

  if (ownActions) {
    ownActions.style.display = "none";
  }

  if (otherActions) {
    otherActions.style.display = "flex";
  }

  try {

    if (
      !window.IGCA_API ||
      typeof IGCA_API.getProfileById !== "function"
    ) {
      throw new Error("Profile API unavailable.");
    }

    const profile =
      await IGCA_API.getProfileById(profileId);

    if (!profile) {
      throw new Error("Profile not found.");
    }

    renderOtherProfile(profile);

    /*
     * IMPORTANT:
     * Buttons are attached AFTER profile is rendered.
     */
    await setupOtherProfileActions(profile);

  } catch (error) {

    console.error(
      "Other profile load error:",
      error
    );

    setText(
      "p-name",
      "Profile unavailable"
    );

    setText("p-title", "");
    setText("p-meta", "");

    setText(
      "p-about",
      error?.message ||
      "This member profile is not available."
    );

    setText("p-exp-current", "—");

    const expertise =
      document.getElementById("p-expertise");

    if (expertise) {
      expertise.innerHTML = "";
    }

    const posts =
      document.getElementById("p-posts");

    if (posts) {

      posts.innerHTML =
        App.emptyState(
          "No posts yet",
          ""
        );
    }

    const network =
      document.getElementById("p-network");

    if (network) {

      network.innerHTML =
        App.emptyState(
          "No mutual connections yet",
          ""
        );
    }
  }
}


/* ==========================================================================
   OTHER PROFILE BUTTONS
   ========================================================================== */

async function setupOtherProfileActions(profile) {

  const connectButton =
    document.querySelector(
      "#other-profile-actions .btn-primary"
    );

  const buttons =
    document.querySelectorAll(
      "#other-profile-actions button"
    );

  if (!connectButton) {
    return;
  }

  /*
   * Button order from profile.html:
   *
   * 0 = Connect
   * 1 = Message
   * 2 = Request Meeting
   * 3 = Follow
   */

  const messageButton =
    buttons[1];

  const meetingButton =
    buttons[2];

  const followButton =
    buttons[3];


  /* ------------------------------------------------------------------------
     CURRENT USER
  ------------------------------------------------------------------------ */

  const currentUser =
    await IGCA_API.user();

  if (!currentUser) {
    console.warn(
      "User not authenticated."
    );
    return;
  }

  const targetUserId =
    profile.id;


  /*
   * Do not allow connecting with yourself.
   */

  if (
    String(currentUser.id) ===
    String(targetUserId)
  ) {

    connectButton.style.display =
      "none";

    if (messageButton) {
      messageButton.style.display =
        "none";
    }

    if (meetingButton) {
      meetingButton.style.display =
        "none";
    }

    if (followButton) {
      followButton.style.display =
        "none";
    }

    return;
  }


  /* ------------------------------------------------------------------------
     CHECK EXISTING CONNECTION
  ------------------------------------------------------------------------ */

  let existingConnection = null;

  try {

    const connections =
      await IGCA_API.connections();

    existingConnection =
      connections.find(connection => {

        const requester =
          String(connection.requester_id);

        const addressee =
          String(connection.addressee_id);

        const me =
          String(currentUser.id);

        const other =
          String(targetUserId);

        return (
          (
            requester === me &&
            addressee === other
          ) ||
          (
            requester === other &&
            addressee === me
          )
        );

      });

  } catch (error) {

    console.warn(
      "Unable to check connection:",
      error
    );
  }


  updateConnectButton(
    connectButton,
    existingConnection,
    currentUser.id
  );


  /* ------------------------------------------------------------------------
     CONNECT
  ------------------------------------------------------------------------ */

  connectButton.addEventListener(
    "click",
    async () => {

      await handleConnect(
        connectButton,
        currentUser.id,
        targetUserId,
        profile
      );

    }
  );


  /* ------------------------------------------------------------------------
     MESSAGE
  ------------------------------------------------------------------------ */

  if (messageButton) {

    messageButton.addEventListener(
      "click",
      async () => {

        await openMessage(
          targetUserId
        );

      }
    );
  }


  /* ------------------------------------------------------------------------
     REQUEST MEETING
  ------------------------------------------------------------------------ */

  if (meetingButton) {

    meetingButton.addEventListener(
      "click",
      async () => {

        await handleMeetingRequest(
          currentUser.id,
          targetUserId,
          profile
        );

      }
    );
  }


  /* ------------------------------------------------------------------------
     FOLLOW
  ------------------------------------------------------------------------ */

  if (followButton) {

    followButton.addEventListener(
      "click",
      () => {

        alert(
          "Follow feature will be available soon."
        );

      }
    );
  }
}


/* ==========================================================================
   CONNECT BUTTON STATE
   ========================================================================== */

function updateConnectButton(
  button,
  connection,
  currentUserId
) {

  if (!button) {
    return;
  }

  if (!connection) {

    button.textContent =
      "Connect";

    button.disabled =
      false;

    button.classList.remove(
      "btn-outline"
    );

    button.classList.add(
      "btn-primary"
    );

    return;
  }


  const status =
    connection.status;


  if (status === "accepted") {

    button.textContent =
      "Connected";

    button.disabled =
      true;

    return;
  }


  if (
    status === "pending" &&
    String(connection.requester_id) ===
    String(currentUserId)
  ) {

    button.textContent =
      "Request Sent";

    button.disabled =
      true;

    return;
  }


  if (
    status === "pending" &&
    String(connection.addressee_id) ===
    String(currentUserId)
  ) {

    button.textContent =
      "Accept Request";

    button.disabled =
      false;

    return;
  }


  button.textContent =
    "Connect";

  button.disabled =
    false;
}


/* ==========================================================================
   HANDLE CONNECT
   ========================================================================== */

async function handleConnect(
  button,
  currentUserId,
  targetUserId,
  profile
) {

  if (
    !currentUserId ||
    !targetUserId
  ) {
    return;
  }

  if (
    String(currentUserId) ===
    String(targetUserId)
  ) {
    return;
  }


  const originalText =
    button.textContent;


  button.disabled =
    true;

  button.textContent =
    "Sending...";


  try {

    /*
     * Check again to prevent duplicate requests.
     */

    const {
      data: existing,
      error: existingError
    } = await sb
      .from("connections")
      .select(
        "id, requester_id, addressee_id, status"
      )
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
      )
      .limit(1);


    if (existingError) {
      throw existingError;
    }


    if (
      existing &&
      existing.length
    ) {

      const connection =
        existing[0];


      if (
        connection.status ===
        "accepted"
      ) {

        button.textContent =
          "Connected";

        button.disabled =
          true;

        return;
      }


      if (
        connection.status ===
        "pending"
      ) {

        if (
          String(
            connection.requester_id
          ) ===
          String(currentUserId)
        ) {

          button.textContent =
            "Request Sent";

          button.disabled =
            true;

          return;
        }

        /*
         * Incoming request:
         * accept it.
         */

        const {
          error: acceptError
        } = await sb
          .from("connections")
          .update({
            status: "accepted"
          })
          .eq(
            "id",
            connection.id
          );


        if (acceptError) {
          throw acceptError;
        }


        await createNotification(
          connection.requester_id,
          "Connection accepted",
          `${getProfileName(profile)} accepted your connection request.`,
          "connection_accepted"
        );


        button.textContent =
          "Connected";

        button.disabled =
          true;

        alert(
          "Connection accepted."
        );

        return;
      }
    }


    /*
     * Create new connection.
     */

    const {
      data: newConnection,
      error: connectionError
    } = await sb
      .from("connections")
      .insert({
        requester_id:
          currentUserId,

        addressee_id:
          targetUserId,

        status:
          "pending"
      })
      .select(
        "id, requester_id, addressee_id, status"
      )
      .single();


    if (connectionError) {
      throw connectionError;
    }


    /*
     * Create notification for receiver.
     */

    const senderProfile =
  await IGCA_API.profile();

const senderName =
  senderProfile?.full_name ||
  senderProfile?.username ||
  "An IGCA member";

await createNotification(
  targetUserId,
  "New connection request",
  `${senderName} sent you a connection request.`,
  "connection_request"
);

    button.textContent =
      "Request Sent";

    button.disabled =
      true;


    console.log(
      "Connection created:",
      newConnection
    );


    alert(
      "Connection request sent successfully."
    );


  } catch (error) {

    console.error(
      "Connect error:",
      error
    );


    button.disabled =
      false;

    button.textContent =
      originalText;


    alert(
      error?.message ||
      "Unable to send connection request."
    );
  }
}


/* ==========================================================================
   CREATE NOTIFICATION
   ========================================================================== */

async function createNotification(
  userId,
  title,
  message,
  type
) {

  if (!userId) {
    return;
  }


  const {
    error
  } = await sb
    .from("notifications")
    .insert({
      user_id:
        userId,

      title:
        title,

      message:
        message,

      type:
        type,

      is_read:
        false,

      created_at:
        new Date().toISOString()
    });


  if (error) {

    console.error(
      "Notification creation failed:",
      error
    );

    /*
     * Don't break connection creation
     * only because notification failed.
     */

    return;
  }


  console.log(
    "Notification created successfully."
  );
}


/* ==========================================================================
   MESSAGE
   ========================================================================== */

async function openMessage(
  targetUserId
) {

  if (!targetUserId) {
    return;
  }


  /*
   * Messages page already knows how to:
   *
   * 1. Find existing conversation
   * 2. Create a conversation
   * 3. Add members
   *
   * So don't duplicate conversation creation here.
   */

  window.location.href =
    `messages.html?user=${encodeURIComponent(
      targetUserId
    )}`;
}


/* ==========================================================================
   MEETING REQUEST
   ========================================================================== */

async function handleMeetingRequest(
  currentUserId,
  targetUserId,
  profile
) {

  if (!currentUserId || !targetUserId) {
    return;
  }


  const button =
    document.querySelector(
      "#other-profile-actions button:nth-child(3)"
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Sending...";
  }


  try {

    /*
     * Currently use notification system.
     *
     * Meeting table can be connected later
     * without changing the profile UI.
     */

    await createNotification(
      targetUserId,
      "Meeting request",
      `${getCurrentUserName()} requested a meeting with you.`,
      "meeting_request"
    );


    if (button) {

      button.textContent =
        "Request Sent";
    }


    alert(
      "Meeting request sent successfully."
    );


  } catch (error) {

    console.error(
      "Meeting request error:",
      error
    );


    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Request Meeting";
    }


    alert(
      error?.message ||
      "Unable to send meeting request."
    );
  }
}


/* ==========================================================================
   PROFILE RENDER
   ========================================================================== */

function renderProfile(profile) {

  const name =
    profile.full_name ||
    profile.username ||
    "IGCA Member";

  const headline =
    profile.headline ||
    "";

  const company =
    profile.company_name ||
    "";

  const location =
    profile.location ||
    "";

  const industry =
    profile.industry ||
    "";

  const bio =
    profile.bio ||
    "You haven't added a bio yet. Open Settings to complete your profile.";


  renderAvatar(
    profile,
    name
  );


  setText(
    "p-name",
    name
  );


  setText(
    "p-title",
    [headline, company]
      .filter(Boolean)
      .join(" at ")
      ||
      "Add your professional title"
  );


  setText(
    "p-meta",
    [location, industry]
      .filter(Boolean)
      .join(" · ")
      ||
      "Add your location and industry"
  );


  setText(
    "p-about",
    bio
  );


  setText(
    "p-exp-current",
    [headline, company]
      .filter(Boolean)
      .join(", ")
      ||
      "Add your current role"
  );


  const verify =
    document.getElementById("p-verify");

  if (verify) {

    verify.innerHTML =
      profile.is_verified
        ? App.verifyBadgeHTML()
        : "";
  }


  renderExpertise(
    profile.expertise
  );


  renderEmptyPosts(
    "Anything you share will appear here."
  );


  renderEmptyNetwork(
    "People you connect with will appear here."
  );
}


/* ==========================================================================
   OTHER PROFILE RENDER
   ========================================================================== */

function renderOtherProfile(person) {

  /*
   * IMPORTANT:
   * Supabase profiles column names.
   */

  const name =
    person.full_name ||
    person.username ||
    "IGCA Member";

  const title =
    person.headline ||
    "";

  const company =
    person.company_name ||
    "";

  const location =
    person.location ||
    "";

  const industry =
    person.industry ||
    "";

  const bio =
    person.bio ||
    "";


  renderAvatar(
    person,
    name
  );


  setText(
    "p-name",
    name
  );


  setText(
    "p-title",
    [title, company]
      .filter(Boolean)
      .join(" at ")
    ||
    "IGCA Member"
  );


  setText(
    "p-meta",
    [location, industry]
      .filter(Boolean)
      .join(" · ")
  );


  setText(
    "p-about",
    bio ||
    `${name} is an IGCA member${
      company
        ? ` at ${company}`
        : ""
    }${
      location
        ? `, based in ${location}`
        : ""
    }.`
  );


  setText(
    "p-exp-current",
    [title, company]
      .filter(Boolean)
      .join(", ")
    ||
    "—"
  );


  const verify =
    document.getElementById("p-verify");

  if (verify) {

    verify.innerHTML =
      person.is_verified
        ? App.verifyBadgeHTML()
        : "";
  }


  renderExpertise(
    person.expertise
  );


  renderEmptyPosts(
    "No posts yet"
  );


  renderEmptyNetwork(
    "No mutual connections yet"
  );
}


/* ==========================================================================
   AVATAR
   ========================================================================== */

function renderAvatar(
  profile,
  name
) {

  const avatar =
    document.getElementById("p-avatar");

  if (!avatar) {
    return;
  }


  if (profile.avatar_url) {

    avatar.innerHTML = `
      <img
        src="${escapeHTML(profile.avatar_url)}"
        alt="${escapeHTML(name)}"
        style="
          width:100%;
          height:100%;
          object-fit:cover;
          border-radius:inherit;
          display:block;
        "
      >
    `;

  } else {

    avatar.textContent =
      App.initials(name);
  }
}


/* ==========================================================================
   EXPERTISE
   ========================================================================== */

function renderExpertise(
  expertiseData
) {

  const expertise =
    document.getElementById(
      "p-expertise"
    );

  if (!expertise) {
    return;
  }


  const items =
    Array.isArray(expertiseData)
      ? expertiseData
      : [];


  if (!items.length) {

    expertise.innerHTML =
      App.emptyState(
        "No expertise listed",
        ""
      );

    return;
  }


  expertise.innerHTML =
    items
      .map(
        item => `
          <span class="chip">
            ${escapeHTML(item)}
          </span>
        `
      )
      .join("");
}


/* ==========================================================================
   EMPTY POSTS
   ========================================================================== */

function renderEmptyPosts(
  description
) {

  const posts =
    document.getElementById(
      "p-posts"
    );

  if (!posts) {
    return;
  }


  posts.innerHTML =
    App.emptyState(
      "No posts yet",
      description || ""
    );
}


/* ==========================================================================
   EMPTY NETWORK
   ========================================================================== */

function renderEmptyNetwork(
  description
) {

  const network =
    document.getElementById(
      "p-network"
    );

  if (!network) {
    return;
  }


  network.innerHTML =
    App.emptyState(
      description ||
      "No connections yet",
      ""
    );
}


/* ==========================================================================
   USER NAME
   ========================================================================== */

function getProfileName(
  profile
) {

  return (
    profile?.full_name ||
    profile?.username ||
    "IGCA Member"
  );
}


function getCurrentUserName() {

  const name =
    document.getElementById(
      "p-current-user-name"
    )?.textContent;

  return (
    name ||
    "An IGCA member"
  );
}


/* ==========================================================================
   HELPERS
   ========================================================================== */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {

    element.textContent =
      value ?? "";
  }
}


function escapeHTML(
  value
) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showProfileError() {

  setText(
    "p-name",
    "Unable to load profile"
  );

  setText(
    "p-title",
    ""
  );

  setText(
    "p-meta",
    ""
  );

  setText(
    "p-about",
    "Please try again or open Settings to update your profile."
  );
}