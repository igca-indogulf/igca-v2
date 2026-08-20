/* ==========================================================================
   IGCA — Messages
   Production Messaging System
   Supabase JS v2
   ========================================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", initMessages);


/* ==========================================================================
   STATE
   ========================================================================== */

let currentUser = null;

let conversations = [];

let activeConversation = null;
let activeConversationId = null;
let activeOtherUser = null;

let activeMessageChannel = null;
let allMessageChannel = null;
let notificationChannel = null;

let loadingConversations = false;


/* ==========================================================================
   INIT
   ========================================================================== */

async function initMessages() {

  try {

    if (
      window.App &&
      typeof App.mountShell === "function"
    ) {
      App.mountShell("messages.html");
    }

    await loadConversations();

    /*
     * If profile.html redirected here with:
     *
     * messages.html?user=UUID
     *
     * automatically open that conversation.
     */

    const params = new URLSearchParams(
      window.location.search
    );

    const targetUserId =
      params.get("user");

    if (targetUserId) {

      const targetConversation =
        conversations.find(
          conversation =>
            String(
              conversation.otherUser?.id
            ) === String(targetUserId)
        );

      if (targetConversation) {

        await openConversation(
          targetConversation
        );

      } else {

        console.warn(
          "Target user is not an accepted connection:",
          targetUserId
        );

      }
    }

  } catch (error) {

    console.error(
      "IGCA Messages initialization failed:",
      error
    );

  }
}


/* ==========================================================================
   DOM
   ========================================================================== */

function getDOM() {

  return {

    convoItems:
      document.getElementById("convo-items"),

    chatWindow:
      document.getElementById("chat-window"),

    messagesShell:
      document.getElementById("messages-shell"),

    conversationCount:
      document.getElementById("conversation-count"),

    searchInput:
      document.getElementById(
        "conversation-search-input"
      )

  };

}


/* ==========================================================================
   HELPERS
   ========================================================================== */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function getName(user) {

  return (
    user?.full_name ||
    user?.username ||
    "IGCA Member"
  );

}


function getInitials(name) {

  if (
    window.App &&
    typeof App.initials === "function"
  ) {

    return App.initials(name);

  }

  return String(name || "User")
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

}


function avatar(
  user,
  size = "avatar-sm"
) {

  const name =
    getName(user);

  if (user?.avatar_url) {

    return `
      <div class="avatar ${size}">
        <img
          src="${escapeHTML(user.avatar_url)}"
          alt="${escapeHTML(name)}"
          style="
            width:100%;
            height:100%;
            object-fit:cover;
            border-radius:inherit;
            display:block;
          "
        >
      </div>
    `;

  }

  return `
    <div class="avatar ${size}">
      ${escapeHTML(getInitials(name))}
    </div>
  `;

}


function formatTime(value) {

  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

}


function formatListTime(value) {

  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const now =
    new Date();

  if (
    date.toDateString() ===
    now.toDateString()
  ) {

    return formatTime(value);

  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short"
  });

}


/* ==========================================================================
   EMPTY / LOADING
   ========================================================================== */

function renderEmptyChat() {

  const { chatWindow } =
    getDOM();

  if (!chatWindow) {
    return;
  }

  chatWindow.innerHTML = `
    <div class="chat-empty">

      <div class="chat-empty-icon">
        💬
      </div>

      <h2>
        Select a conversation
      </h2>

      <p>
        Choose a connection to start a professional conversation.
      </p>

    </div>
  `;

}


function renderChatLoading() {

  const { chatWindow } =
    getDOM();

  if (!chatWindow) {
    return;
  }

  chatWindow.innerHTML = `
    <div class="chat-empty">

      <div class="loading-spinner"></div>

      <p>
        Opening conversation...
      </p>

    </div>
  `;

}


/* ==========================================================================
   LOAD CONVERSATIONS
   ========================================================================== */

async function loadConversations() {

  const { convoItems } =
    getDOM();

  if (
    !convoItems ||
    loadingConversations
  ) {
    return;
  }

  loadingConversations = true;

  convoItems.innerHTML = `
    <div class="messages-loading">
      <div class="loading-spinner"></div>
      <span>Loading chats...</span>
    </div>
  `;

  try {

    if (
      !window.IGCA_API ||
      typeof IGCA_API.user !== "function"
    ) {
      throw new Error(
        "IGCA API is unavailable."
      );
    }

    currentUser =
      await IGCA_API.user();

    if (!currentUser?.id) {

      window.location.href =
        "login.html";

      return;

    }


    /* ----------------------------------------------------------------------
       ACCEPTED CONNECTIONS
       ---------------------------------------------------------------------- */

    const {
      data: connectionRows,
      error: connectionError
    } = await sb
      .from("connections")
      .select(`
        id,
        requester_id,
        addressee_id,
        status
      `)
      .or(
        `requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`
      )
      .eq(
        "status",
        "accepted"
      );

    if (connectionError) {
      throw connectionError;
    }

    const acceptedConnections =
      connectionRows || [];


    /* ----------------------------------------------------------------------
       OTHER USER IDS
       ---------------------------------------------------------------------- */

    const acceptedOtherUserIds = [
      ...new Set(
        acceptedConnections
          .map(connection => {

            const me =
              String(currentUser.id);

            return String(
              connection.requester_id
            ) === me
              ? connection.addressee_id
              : connection.requester_id;

          })
          .filter(Boolean)
          .map(String)
      )
    ];


    /* ----------------------------------------------------------------------
       CONNECTION MAP
       ---------------------------------------------------------------------- */

    const connectionMap =
      new Map();

    acceptedConnections.forEach(
      connection => {

        const me =
          String(currentUser.id);

        const otherUserId =
          String(
            connection.requester_id
          ) === me
            ? connection.addressee_id
            : connection.requester_id;

        if (otherUserId) {

          connectionMap.set(
            String(otherUserId),
            connection
          );

        }

      }
    );


    /* ----------------------------------------------------------------------
       PROFILES
       ---------------------------------------------------------------------- */

    let acceptedProfiles = [];

    if (
      acceptedOtherUserIds.length
    ) {

      const {
        data,
        error
      } = await sb
        .from("profiles")
        .select(`
          id,
          full_name,
          username,
          headline,
          account_type,
          avatar_url,
          company_name,
          location,
          industry
        `)
        .in(
          "id",
          acceptedOtherUserIds
        );

      if (error) {
        throw error;
      }

      acceptedProfiles =
        data || [];

    }

    const profileMap =
      new Map(
        acceptedProfiles.map(
          profile => [
            String(profile.id),
            profile
          ]
        )
      );


    /* ----------------------------------------------------------------------
       MY MEMBERSHIPS
       ---------------------------------------------------------------------- */

    const {
      data: myMemberships,
      error: membershipError
    } = await sb
      .from("conversation_members")
      .select(
        "conversation_id"
      )
      .eq(
        "user_id",
        currentUser.id
      );

    if (membershipError) {
      throw membershipError;
    }

    const conversationIds =
      [
        ...new Set(
          (myMemberships || [])
            .map(
              row =>
                row.conversation_id
            )
            .filter(Boolean)
            .map(String)
        )
      ];


    /* ----------------------------------------------------------------------
       MEMBERS
       ---------------------------------------------------------------------- */

    let allMembers = [];

    if (
      conversationIds.length
    ) {

      const {
        data,
        error
      } = await sb
        .from("conversation_members")
        .select(`
          conversation_id,
          user_id
        `)
        .in(
          "conversation_id",
          conversationIds
        );

      if (error) {
        throw error;
      }

      allMembers =
        data || [];

    }


    /* ----------------------------------------------------------------------
       MESSAGES
       ---------------------------------------------------------------------- */

    let allMessages = [];

    if (
      conversationIds.length
    ) {

      const {
        data,
        error
      } = await sb
        .from("messages")
        .select(`
          id,
          conversation_id,
          sender_id,
          body,
          created_at,
          read_at
        `)
        .in(
          "conversation_id",
          conversationIds
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

      if (error) {
        throw error;
      }

      allMessages =
        data || [];

    }


    /* ----------------------------------------------------------------------
       GROUP MESSAGES
       ---------------------------------------------------------------------- */

    const messagesByConversation =
      new Map();

    allMessages.forEach(
      message => {

        const id =
          String(
            message.conversation_id
          );

        if (
          !messagesByConversation.has(id)
        ) {

          messagesByConversation.set(
            id,
            []
          );

        }

        messagesByConversation
          .get(id)
          .push(message);

      }
    );


    /* ----------------------------------------------------------------------
       BUILD CONVERSATIONS
       ---------------------------------------------------------------------- */

    conversations = [];

    conversationIds.forEach(
      conversationId => {

        const members =
          allMembers.filter(
            member =>
              String(
                member.conversation_id
              ) ===
              String(conversationId)
          );

        const otherMember =
          members.find(
            member =>
              String(
                member.user_id
              ) !==
              String(currentUser.id)
          );

        if (!otherMember) {
          return;
        }

        const otherUserId =
          String(
            otherMember.user_id
          );

        /*
         * Conversation is visible only
         * while connection is accepted.
         */

        const connection =
          connectionMap.get(
            otherUserId
          );

        if (!connection) {
          return;
        }

        const otherUser =
          profileMap.get(
            otherUserId
          );

        if (!otherUser) {
          return;
        }

        const msgs =
          messagesByConversation.get(
            String(conversationId)
          ) || [];

        const lastMessage =
          msgs[0] || null;

        const unreadCount =
          msgs.filter(
            message =>
              String(
                message.sender_id
              ) !==
              String(currentUser.id) &&
              !message.read_at
          ).length;

        conversations.push({

          conversationId:
            String(conversationId),

          connectionId:
            connection.id,

          otherUser,

          lastMessage,

          unreadCount

        });

      }
    );


    /* ----------------------------------------------------------------------
       ACCEPTED CONNECTIONS WITHOUT CONVERSATION
       ---------------------------------------------------------------------- */

    acceptedConnections.forEach(
      connection => {

        const me =
          String(currentUser.id);

        const otherUserId =
          String(
            connection.requester_id
          ) === me
            ? String(connection.addressee_id)
            : String(connection.requester_id);

        const otherUser =
          profileMap.get(
            otherUserId
          );

        if (!otherUser) {
          return;
        }

        const exists =
          conversations.some(
            conversation =>
              String(
                conversation.otherUser?.id
              ) ===
              otherUserId
          );

        if (exists) {
          return;
        }

        conversations.push({

          conversationId:
            null,

          connectionId:
            connection.id,

          otherUser,

          lastMessage:
            null,

          unreadCount:
            0

        });

      }
    );


    sortConversations();

    updateConversationCount();

    renderConversationList();

    if (
      !conversations.length
    ) {
      renderEmptyChat();
    }


    subscribeToGlobalMessages();

    subscribeToNotifications();

  } catch (error) {

    console.error(
      "IGCA conversations load failed:",
      error
    );

    convoItems.innerHTML = `
      <div class="convo-empty">

        <div class="avatar avatar-md">
          !
        </div>

        <strong>
          Unable to load chats
        </strong>

        <span>
          ${escapeHTML(
            error?.message ||
            "Something went wrong while loading chats."
          )}
        </span>

      </div>
    `;

    renderEmptyChat();

  } finally {

    loadingConversations =
      false;

  }

}


/* ==========================================================================
   SORT
   ========================================================================== */

function sortConversations() {

  conversations.sort(
    (a, b) => {

      const aTime =
        a.lastMessage?.created_at
          ? new Date(
              a.lastMessage.created_at
            ).getTime()
          : 0;

      const bTime =
        b.lastMessage?.created_at
          ? new Date(
              b.lastMessage.created_at
            ).getTime()
          : 0;

      return bTime - aTime;

    }
  );

}


/* ==========================================================================
   COUNT
   ========================================================================== */

function updateConversationCount() {

  const {
    conversationCount
  } = getDOM();

  if (!conversationCount) {
    return;
  }

  const count =
    conversations.length;

  conversationCount.textContent =
    `${count} ${
      count === 1
        ? "connection"
        : "connections"
    }`;

}


/* ==========================================================================
   RENDER SIDEBAR
   ========================================================================== */

function renderConversationList() {

  const {
    convoItems
  } = getDOM();

  if (!convoItems) {
    return;
  }

  if (!conversations.length) {

    convoItems.innerHTML = `
      <div class="convo-empty">

        <div class="avatar avatar-md">
          ?
        </div>

        <strong>
          No connections yet
        </strong>

        <span>
          Connect with someone to start a conversation.
        </span>

      </div>
    `;

    return;

  }

  convoItems.innerHTML =
    conversations
      .map(
        conversation => {

          const user =
            conversation.otherUser;

          if (!user?.id) {
            return "";
          }

          const name =
            getName(user);

          const preview =
            conversation.lastMessage
              ? conversation.lastMessage.body
              : "You're connected. Start a conversation.";

          const time =
            conversation.lastMessage
              ? formatListTime(
                  conversation.lastMessage.created_at
                )
              : "";

          const active =
            activeConversation ===
            conversation;

          const unread =
            Number(
              conversation.unreadCount || 0
            );

          return `
            <div
              class="convo-item ${
                active ? "active" : ""
              }"
              data-user-id="${escapeHTML(user.id)}"
            >

              ${avatar(user)}

              <div class="convo-content">

                <div class="convo-top">

                  <span class="convo-name">
                    ${escapeHTML(name)}
                  </span>

                  <span class="convo-time">
                    ${escapeHTML(time)}
                  </span>

                </div>

                <div class="convo-preview">
                  ${escapeHTML(preview)}
                </div>

              </div>

              <div
                class="convo-actions"
                style="
                  display:flex;
                  align-items:center;
                  gap:6px;
                  margin-left:auto;
                "
              >

                ${
                  unread > 0
                    ? `
                      <span class="convo-unread">
                        ${
                          unread > 99
                            ? "99+"
                            : unread
                        }
                      </span>
                    `
                    : ""
                }

                <button
                  type="button"
                  class="convo-remove-btn"
                  data-remove-connection="${escapeHTML(
                    conversation.connectionId || ""
                  )}"
                  title="Remove connection"
                  aria-label="Remove connection"
                >
                  ×
                </button>

              </div>

            </div>
          `;

        }
      )
      .join("");


  /* ------------------------------------------------------------------------
     OPEN
     ------------------------------------------------------------------------ */

  convoItems
    .querySelectorAll(".convo-item")
    .forEach(item => {

      item.addEventListener(
        "click",
        async event => {

          if (
            event.target.closest(
              ".convo-remove-btn"
            )
          ) {
            return;
          }

          const userId =
            item.dataset.userId;

          const conversation =
            conversations.find(
              entry =>
                String(
                  entry.otherUser?.id
                ) === String(userId)
            );

          if (!conversation) {
            return;
          }

          await openConversation(
            conversation
          );

        }
      );

    });


  /* ------------------------------------------------------------------------
     REMOVE
     ------------------------------------------------------------------------ */

  convoItems
    .querySelectorAll(
      ".convo-remove-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async event => {

          event.stopPropagation();

          const connectionId =
            button.dataset
              .removeConnection;

          if (!connectionId) {
            return;
          }

          const conversation =
            conversations.find(
              item =>
                String(
                  item.connectionId
                ) ===
                String(connectionId)
            );

          const name =
            getName(
              conversation?.otherUser
            );

          const confirmed =
            window.confirm(
              `Remove your connection with ${name}?`
            );

          if (!confirmed) {
            return;
          }

          await removeConnection(
            connectionId,
            conversation
          );

        }
      );

    });

}


/* ==========================================================================
   REMOVE CONNECTION
   ========================================================================== */

async function removeConnection(
  connectionId,
  conversation
) {

  if (
    !connectionId ||
    !currentUser?.id
  ) {
    return;
  }

  try {

    const {
      error
    } = await sb
      .from("connections")
      .delete()
      .eq(
        "id",
        connectionId
      )
      .or(
        `requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`
      );

    if (error) {
      throw error;
    }

    if (
      conversation &&
      activeConversation ===
        conversation
    ) {

      activeConversation =
        null;

      activeConversationId =
        null;

      activeOtherUser =
        null;

      closeActiveRealtime();

      const {
        messagesShell
      } = getDOM();

      messagesShell?.classList.remove(
        "chat-open"
      );

      renderEmptyChat();

    }

    conversations =
      conversations.filter(
        item =>
          String(
            item.connectionId
          ) !==
          String(connectionId)
      );

    sortConversations();

    updateConversationCount();

    renderConversationList();

  } catch (error) {

    console.error(
      "Connection removal failed:",
      error
    );

    alert(
      error?.message ||
      "Unable to remove connection."
    );

  }

}


/* ==========================================================================
   GET / CREATE CONVERSATION
   ========================================================================== */

async function getOrCreateConversation(
  otherUserId
) {

  if (!otherUserId) {
    throw new Error(
      "Other user ID is missing."
    );
  }

  if (!currentUser?.id) {
    currentUser =
      await IGCA_API.user();
  }

  if (!currentUser?.id) {
    throw new Error(
      "You are not authenticated."
    );
  }

  if (
    String(currentUser.id) ===
    String(otherUserId)
  ) {
    throw new Error(
      "You cannot message yourself."
    );
  }


  /* ------------------------------------------------------------------------
     CACHE
     ------------------------------------------------------------------------ */

  const cached =
    conversations.find(
      conversation =>
        String(
          conversation.otherUser?.id
        ) ===
        String(otherUserId) &&
        conversation.conversationId
    );

  if (
    cached?.conversationId
  ) {
    return cached.conversationId;
  }


  /* ------------------------------------------------------------------------
     ACCEPTED CONNECTION
     ------------------------------------------------------------------------ */

  const connection =
    await IGCA_API.connectionStatus(
      otherUserId
    );

  if (
    !connection ||
    connection.status !==
      "accepted"
  ) {

    throw new Error(
      "You can only message an accepted connection."
    );

  }


  /* ------------------------------------------------------------------------
     RPC
     ------------------------------------------------------------------------ */

  const {
    data: conversationId,
    error
  } = await sb.rpc(
    "create_direct_conversation",
    {
      p_other_user_id:
        otherUserId
    }
  );

  if (error) {

    console.error(
      "create_direct_conversation RPC failed:",
      error
    );

    throw new Error(
      error.message ||
      "Unable to create conversation."
    );

  }

  if (!conversationId) {
    throw new Error(
      "Conversation ID was not returned."
    );
  }


  const local =
    conversations.find(
      conversation =>
        String(
          conversation.otherUser?.id
        ) ===
        String(otherUserId)
    );

  if (local) {
    local.conversationId =
      conversationId;
  }

  return conversationId;

}


/* ==========================================================================
   OPEN CONVERSATION
   ========================================================================== */

async function openConversation(
  conversation
) {

  if (
    !conversation?.otherUser?.id
  ) {
    return;
  }

  activeConversation =
    conversation;

  activeOtherUser =
    conversation.otherUser;

  const {
    messagesShell
  } = getDOM();

  messagesShell?.classList.add(
    "chat-open"
  );

  renderChatLoading();

  try {

    if (
      !conversation.conversationId
    ) {

      conversation.conversationId =
        await getOrCreateConversation(
          activeOtherUser.id
        );

    }

    activeConversationId =
      String(
        conversation.conversationId
      );

    await markConversationRead(
      activeConversationId
    );

    conversation.unreadCount =
      0;

    await renderChat();

    subscribeToActiveConversation();

    renderConversationList();

  } catch (error) {

    console.error(
      "Open conversation error:",
      error
    );

    const {
      chatWindow
    } = getDOM();

    if (chatWindow) {

      chatWindow.innerHTML = `
        <div class="chat-empty">

          <div class="chat-empty-icon">
            !
          </div>

          <h2>
            Unable to open conversation
          </h2>

          <p>
            ${escapeHTML(
              error?.message ||
              "Something went wrong."
            )}
          </p>

        </div>
      `;

    }

  }

}


/* ==========================================================================
   RENDER CHAT
   ========================================================================== */

async function renderChat() {

  if (!activeConversationId) {
    return;
  }

  const {
    chatWindow
  } = getDOM();

  if (!chatWindow) {
    return;
  }

  const messages =
    await IGCA_API.messages(
      activeConversationId
    );

  const user =
    activeOtherUser;

  const name =
    getName(user);

  chatWindow.innerHTML = `

    <header
      class="chat-header"
      id="chat-header"
    >

      <div
        class="chat-header-main"
        style="cursor:pointer;"
        id="chat-profile-link"
      >

        ${avatar(
          user,
          "avatar-sm"
        )}

        <div class="chat-header-info">

          <div class="chat-header-name">
            ${escapeHTML(name)}
          </div>

          <div class="chat-header-subtitle">
            ${escapeHTML(
              user?.headline ||
              user?.account_type ||
              "IGCA Member"
            )}
          </div>

        </div>

      </div>

    </header>

    <div
      class="chat-body"
      id="chat-body"
    >

      ${
        messages?.length
          ? messages
              .map(renderMessage)
              .join("")
          : renderWelcome(name)
      }

    </div>

    <div class="chat-input">

      <input
        id="chat-input-field"
        type="text"
        placeholder="Write a message..."
        autocomplete="off"
        maxlength="5000"
      >

      <button
        id="send-btn"
        class="btn btn-primary chat-send-btn"
        type="button"
      >
        Send
      </button>

    </div>

  `;

  scrollChatToBottom();

  attachChatHeader();

  attachMessageEvents();

}


/* ==========================================================================
   CHAT HEADER
   ========================================================================== */

function attachChatHeader() {

  const element =
    document.getElementById(
      "chat-profile-link"
    );

  if (
    !element ||
    !activeOtherUser?.id
  ) {
    return;
  }

  element.addEventListener(
    "click",
    () => {

      window.location.href =
        `profile.html?id=${encodeURIComponent(
          activeOtherUser.id
        )}`;

    }
  );

}


/* ==========================================================================
   WELCOME
   ========================================================================== */

function renderWelcome(name) {

  return `
    <div
      class="chat-empty"
      style="min-height:100%;"
    >

      <div class="chat-empty-icon">
        ${escapeHTML(
          getInitials(name)
        )}
      </div>

      <h2>
        You're connected with
        ${escapeHTML(name)}
      </h2>

      <p>
        Start a professional conversation.
      </p>

    </div>
  `;

}


/* ==========================================================================
   MESSAGE HTML
   ========================================================================== */

function renderMessage(
  message
) {

  const mine =
    String(
      message.sender_id
    ) ===
    String(
      currentUser?.id
    );

  const messageId =
    String(
      message.id || ""
    );

  const read =
    Boolean(
      message.read_at
    );

  return `
    <div
      class="message-row ${
        mine
          ? "mine"
          : "theirs"
      }"
      data-message-id="${escapeHTML(
        messageId
      )}"
    >

      <div
        class="msg-bubble ${
          mine
            ? "msg-out"
            : "msg-in"
        }"
      >

        ${escapeHTML(
          message.body
        )}

      </div>

      <div class="msg-time">

        ${escapeHTML(
          formatTime(
            message.created_at
          )
        )}

        ${
          mine
            ? `
              <span
                class="message-status"
                title="${
                  read
                    ? "Seen"
                    : "Sent"
                }"
                style="
                  margin-left:4px;
                  opacity:.75;
                "
              >
                ${read ? "✓✓" : "✓"}
              </span>
            `
            : ""
        }

        ${
          mine && message.id
            ? `
              <button
                type="button"
                class="delete-message-btn"
                data-message-id="${escapeHTML(
                  messageId
                )}"
                title="Delete message"
                style="
                  border:0;
                  background:transparent;
                  cursor:pointer;
                  margin-left:6px;
                  opacity:.55;
                "
              >
                🗑
              </button>
            `
            : ""
        }

      </div>

    </div>
  `;

}


/* ==========================================================================
   SEND / DELETE EVENTS
   ========================================================================== */

function attachMessageEvents() {

  const input =
    document.getElementById(
      "chat-input-field"
    );

  const button =
    document.getElementById(
      "send-btn"
    );

  if (
    !input ||
    !button
  ) {
    return;
  }


  async function sendMessage() {

    const text =
      input.value.trim();

    if (!text) {
      return;
    }

    if (!activeConversationId) {

      alert(
        "Conversation is not ready yet."
      );

      return;

    }

    button.disabled =
      true;

    button.textContent =
      "Sending...";

    try {

      const message =
        await IGCA_API.sendMessage(
          activeConversationId,
          text
        );

      /*
       * Add immediately.
       * Realtime duplicate is prevented
       * by appendMessage().
       */

      appendMessage(message);

      if (
        activeConversation
      ) {

        activeConversation.lastMessage =
          message;

      }

      input.value =
        "";

      input.focus();

      sortConversations();

      renderConversationList();


      /* --------------------------------------------------------------------
         NOTIFICATION
         -------------------------------------------------------------------- */

      const receiverId =
        activeOtherUser?.id;

      if (receiverId) {

        try {

          await createMessageNotification(
            receiverId,
            getName(currentUser),
            text.length > 80
              ? text.substring(0, 80) + "..."
              : text
          );

        } catch (notificationError) {

          console.error(
            "Message notification failed:",
            notificationError
          );

        }

      }

    } catch (error) {

      console.error(
        "Send message error:",
        error
      );

      alert(
        error?.message ||
        "Unable to send message."
      );

    } finally {

      button.disabled =
        false;

      button.textContent =
        "Send";

    }

  }


  button.addEventListener(
    "click",
    sendMessage
  );


  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();

      }

    }
  );


  document
    .querySelectorAll(
      ".delete-message-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async event => {

          event.stopPropagation();

          const messageId =
            button.dataset.messageId;

          if (!messageId) {
            return;
          }

          await deleteMessage(
            messageId
          );

        }
      );

    });


  input.focus();

}


/* ==========================================================================
   DELETE MESSAGE
   ========================================================================== */

async function deleteMessage(
  messageId
) {

  if (
    !messageId ||
    !currentUser?.id
  ) {
    return;
  }

  const confirmed =
    window.confirm(
      "Delete this message?"
    );

  if (!confirmed) {
    return;
  }

  try {

    const {
      error
    } = await sb
      .from("messages")
      .delete()
      .eq(
        "id",
        messageId
      )
      .eq(
        "sender_id",
        currentUser.id
      );

    if (error) {
      throw error;
    }

    const element =
      document.querySelector(
        `[data-message-id="${CSS.escape(
          String(messageId)
        )}"]`
      );

    element?.remove();

  } catch (error) {

    console.error(
      "Message delete failed:",
      error
    );

    alert(
      error?.message ||
      "Unable to delete message."
    );

  }

}


/* ==========================================================================
   NOTIFICATION
   ========================================================================== */

async function createMessageNotification(
  receiverId,
  senderName,
  messagePreview
) {
  if (!receiverId) {
    return;
  }

  const { error } = await sb
    .from("notifications")
    .insert({
      user_id: receiverId,
      title: "New message",
      body: `${senderName}: ${messagePreview}`,
      type: "message",
      read_at: null,
      created_at: new Date().toISOString()
    });

  if (error) {
    throw error;
  }
}

/* ==========================================================================
   APPEND MESSAGE
   ========================================================================== */

function appendMessage(
  message
) {

  if (!message) {
    return;
  }

  if (
    String(
      message.conversation_id
    ) !==
    String(
      activeConversationId
    )
  ) {
    return;
  }

  const body =
    document.getElementById(
      "chat-body"
    );

  if (!body) {
    return;
  }


  /* ------------------------------------------------------------------------
     DUPLICATE PROTECTION
     ------------------------------------------------------------------------ */

  if (
    message.id &&
    body.querySelector(
      `[data-message-id="${CSS.escape(
        String(message.id)
      )}"]`
    )
  ) {

    /*
     * If realtime delivers a message
     * already rendered locally, don't
     * render it again.
     */

    return;

  }


  body
    .querySelectorAll(
      ".chat-empty"
    )
    .forEach(
      element =>
        element.remove()
    );


  body.insertAdjacentHTML(
    "beforeend",
    renderMessage(message)
  );


  /* Attach delete button if needed */

  body
    .querySelectorAll(
      `.delete-message-btn[data-message-id="${CSS.escape(
        String(message.id)
      )}"]`
    )
    .forEach(button => {

      button.onclick =
        () =>
          deleteMessage(
            message.id
          );

    });


  scrollChatToBottom();

}


/* ==========================================================================
   SCROLL
   ========================================================================== */

function scrollChatToBottom() {

  const body =
    document.getElementById(
      "chat-body"
    );

  if (!body) {
    return;
  }

  requestAnimationFrame(
    () => {

      body.scrollTop =
        body.scrollHeight;

    }
  );

}


/* ==========================================================================
   MARK READ
   ========================================================================== */

async function markConversationRead(
  conversationId
) {

  if (
    !conversationId ||
    !currentUser?.id
  ) {
    return;
  }

  const {
    error
  } = await sb
    .from("messages")
    .update({

      read_at:
        new Date().toISOString()

    })
    .eq(
      "conversation_id",
      conversationId
    )
    .neq(
      "sender_id",
      currentUser.id
    )
    .is(
      "read_at",
      null
    );

  if (error) {

    console.error(
      "Mark messages read failed:",
      error
    );

  }

}


/* ==========================================================================
   ACTIVE REALTIME
   ========================================================================== */

function subscribeToActiveConversation() {

  if (!activeConversationId) {
    return;
  }

  if (
    activeMessageChannel
  ) {

    sb.removeChannel(
      activeMessageChannel
    );

  }

  activeMessageChannel =
    sb
      .channel(
        `igca-active-message-${activeConversationId}-${Date.now()}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter:
            `conversation_id=eq.${activeConversationId}`
        },
        async payload => {

          const message =
            payload?.new;

          if (!message) {
            return;
          }

          appendMessage(
            message
          );


          if (
            String(
              message.sender_id
            ) !==
            String(currentUser?.id)
          ) {

            await markConversationRead(
              activeConversationId
            );

          }


          if (
            activeConversation
          ) {

            activeConversation.lastMessage =
              message;

            activeConversation.unreadCount =
              0;

          }

          sortConversations();

          renderConversationList();

        }
      )
      .subscribe(
        status => {

          console.log(
            "IGCA active message realtime:",
            status
          );

        }
      );

}


/* ==========================================================================
   GLOBAL REALTIME
   ========================================================================== */

function subscribeToGlobalMessages() {

  if (
    allMessageChannel
  ) {

    sb.removeChannel(
      allMessageChannel
    );

  }

  allMessageChannel =
    sb
      .channel(
        `igca-global-messages-${Date.now()}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages"
        },
        async payload => {

          const message =
            payload?.new;

          if (!message) {
            return;
          }


          /*
           * Ignore own message.
           */

          if (
            String(
              message.sender_id
            ) ===
            String(currentUser?.id)
          ) {
            return;
          }


          let conversation =
            conversations.find(
              item =>
                String(
                  item.conversationId
                ) ===
                String(
                  message.conversation_id
                )
            );


          /*
           * If conversation wasn't loaded,
           * refresh conversations.
           */

          if (!conversation) {

            await loadConversations();

            conversation =
              conversations.find(
                item =>
                  String(
                    item.conversationId
                  ) ===
                  String(
                    message.conversation_id
                  )
              );

          }


          if (!conversation) {
            return;
          }


          conversation.lastMessage =
            message;


          if (
            String(
              activeConversationId
            ) !==
            String(
              message.conversation_id
            )
          ) {

            conversation.unreadCount =
              Number(
                conversation.unreadCount || 0
              ) + 1;

          }


          sortConversations();

          renderConversationList();

          updateConversationCount();

        }
      )
      .subscribe(
        status => {

          console.log(
            "IGCA global message realtime:",
            status
          );

        }
      );

}


/* ==========================================================================
   NOTIFICATION REALTIME
   ========================================================================== */

function subscribeToNotifications() {

  if (!currentUser?.id) {
    return;
  }

  if (
    notificationChannel
  ) {

    sb.removeChannel(
      notificationChannel
    );

  }

  notificationChannel =
    sb
      .channel(
        `igca-message-notifications-${Date.now()}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter:
            `user_id=eq.${currentUser.id}`
        },
        payload => {

          const notification =
            payload?.new;

          if (!notification) {
            return;
          }

          if (
            notification.type !==
            "message"
          ) {
            return;
          }

          console.log(
            "New message notification:",
            notification
          );

        }
      )
      .subscribe(
        status => {

          console.log(
            "IGCA notification realtime:",
            status
          );

        }
      );

}


/* ==========================================================================
   CLOSE REALTIME
   ========================================================================== */

function closeActiveRealtime() {

  if (
    activeMessageChannel
  ) {

    sb.removeChannel(
      activeMessageChannel
    );

    activeMessageChannel =
      null;

  }

}


/* ==========================================================================
   SEARCH
   ========================================================================== */

document.addEventListener(
  "input",
  event => {

    if (
      event.target?.id !==
      "conversation-search-input"
    ) {
      return;
    }

    const query =
      event.target.value
        .trim()
        .toLowerCase();

    document
      .querySelectorAll(
        ".convo-item"
      )
      .forEach(item => {

        const name =
          item
            .querySelector(
              ".convo-name"
            )
            ?.textContent
            ?.toLowerCase() ||
          "";

        item.style.display =
          !query ||
          name.includes(query)
            ? ""
            : "none";

      });

  }
);


/* ==========================================================================
   CLEANUP
   ========================================================================== */

window.addEventListener(
  "beforeunload",
  () => {

    if (
      activeMessageChannel
    ) {

      sb.removeChannel(
        activeMessageChannel
      );

    }

    if (
      allMessageChannel
    ) {

      sb.removeChannel(
        allMessageChannel
      );

    }

    if (
      notificationChannel
    ) {

      sb.removeChannel(
        notificationChannel
      );

    }

  }
);
