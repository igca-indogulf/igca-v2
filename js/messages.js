/* ==========================================================================
   IGCA — Messages
   Production Messaging System
   Supabase JS v2
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  "use strict";

  /* ==========================================================================
     SHELL
     ========================================================================== */

  if (
    window.App &&
    typeof App.mountShell === "function"
  ) {
    App.mountShell("messages.html");
  }


  /* ==========================================================================
     DOM
     ========================================================================== */

  const convoItems =
    document.getElementById("convo-items");

  const chatWindow =
    document.getElementById("chat-window");

  const messagesShell =
    document.getElementById("messages-shell");

  const conversationCount =
    document.getElementById("conversation-count");

  const searchInput =
    document.getElementById(
      "conversation-search-input"
    );


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
    name,
    size = "avatar-sm"
  ) {

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
     EMPTY CHAT
     ========================================================================== */

  function renderEmptyChat() {

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


  /* ==========================================================================
     LOADING CHAT
     ========================================================================== */

  function renderChatLoading() {

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

      /* ----------------------------------------------------------------------
         CURRENT USER
         ---------------------------------------------------------------------- */

      currentUser =
        await IGCA_API.user();

      if (!currentUser?.id) {

        location.href =
          "login.html";

        return;

      }


      /* ----------------------------------------------------------------------
         STEP 1
         LOAD ONLY ACCEPTED CONNECTIONS
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

        console.error(
          "Accepted connections load failed:",
          connectionError
        );

        throw connectionError;

      }


      const acceptedConnections =
        connectionRows || [];


      /* ----------------------------------------------------------------------
         STEP 2
         GET OTHER USER IDS
         ---------------------------------------------------------------------- */

      const acceptedOtherUserIds = [
        ...new Set(
          acceptedConnections
            .map(connection => {

              return String(
                connection.requester_id
              ) ===
                String(currentUser.id)

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


      for (
        const connection
        of acceptedConnections
      ) {

        const otherUserId =
          String(
            connection.requester_id
          ) ===
            String(currentUser.id)

            ? connection.addressee_id

            : connection.requester_id;


        if (!otherUserId) {
          continue;
        }


        connectionMap.set(
          String(otherUserId),
          connection
        );

      }


      /* ----------------------------------------------------------------------
         STEP 3
         LOAD ACCEPTED USER PROFILES
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
            avatar_url
          `)
          .in(
            "id",
            acceptedOtherUserIds
          );


        if (error) {

          console.error(
            "Accepted profiles load failed:",
            error
          );

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
         RESET
         ---------------------------------------------------------------------- */

      conversations = [];


      /* ----------------------------------------------------------------------
         STEP 4
         LOAD MY CONVERSATION MEMBERSHIPS
         ---------------------------------------------------------------------- */

      const {
        data: myMemberships,
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
          "Conversation memberships load failed:",
          membershipError
        );

        throw membershipError;

      }


      const conversationIds =
        (myMemberships || [])
          .map(
            row =>
              row.conversation_id
          )
          .filter(Boolean);


      /* ----------------------------------------------------------------------
         STEP 5
         LOAD CONVERSATION MEMBERS
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

          console.error(
            "Conversation members load failed:",
            error
          );

          throw error;

        }


        allMembers =
          data || [];

      }


      /* ----------------------------------------------------------------------
         STEP 6
         LOAD MESSAGES
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

          console.error(
            "Messages load failed:",
            error
          );

          throw error;

        }


        allMessages =
          data || [];

      }


      /* ----------------------------------------------------------------------
         STEP 7
         GROUP MESSAGES
         ---------------------------------------------------------------------- */

      const messagesByConversation =
        new Map();


      for (
        const message
        of allMessages
      ) {

        const conversationId =
          String(
            message.conversation_id
          );


        if (
          !messagesByConversation.has(
            conversationId
          )
        ) {

          messagesByConversation.set(
            conversationId,
            []
          );

        }


        messagesByConversation
          .get(conversationId)
          .push(message);

      }


      /* ----------------------------------------------------------------------
         STEP 8
         BUILD EXISTING CONVERSATIONS
         
         IMPORTANT:
         Only show conversations whose
         connection is still accepted.
         ---------------------------------------------------------------------- */

      for (
        const conversationId
        of conversationIds
      ) {

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
          continue;
        }


        const otherUserId =
          String(
            otherMember.user_id
          );


        /*
         * Connection has been removed?
         * Do NOT show old conversation.
         */

        const connection =
          connectionMap.get(
            otherUserId
          );


        if (!connection) {
          continue;
        }


        const otherUser =
          profileMap.get(
            otherUserId
          );


        if (!otherUser) {
          continue;
        }


        const conversationMessages =
          messagesByConversation.get(
            String(conversationId)
          ) || [];


        const lastMessage =
          conversationMessages.length
            ? conversationMessages[0]
            : null;


        const unreadCount =
          conversationMessages.filter(
            message =>
              String(
                message.sender_id
              ) !==
                String(currentUser.id) &&
              !message.read_at
          ).length;


        conversations.push({

          conversationId:

            conversationId,

          connectionId:

            connection.id,

          otherUser:

            otherUser,

          lastMessage:

            lastMessage,

          unreadCount:

            unreadCount

        });

      }


      /* ----------------------------------------------------------------------
         STEP 9
         ADD ACCEPTED CONNECTIONS WITHOUT CHAT
         ---------------------------------------------------------------------- */

      for (
        const connection
        of acceptedConnections
      ) {

        const isRequester =
          String(
            connection.requester_id
          ) ===
          String(currentUser.id);


        const otherUserId =
          isRequester
            ? String(
                connection.addressee_id
              )
            : String(
                connection.requester_id
              );


        const otherUser =
          profileMap.get(
            otherUserId
          );


        if (!otherUser?.id) {
          continue;
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
          continue;
        }


        conversations.push({

          conversationId:

            null,

          connectionId:

            connection.id,

          otherUser:

            otherUser,

          lastMessage:

            null,

          unreadCount:

            0

        });

      }


      /* ----------------------------------------------------------------------
         STEP 10
         SORT + RENDER
         ---------------------------------------------------------------------- */

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
          a.lastMessage?.created_at ||
          "";

        const bTime =
          b.lastMessage?.created_at ||
          "";


        if (
          !aTime &&
          !bTime
        ) {
          return 0;
        }


        if (!aTime) {
          return 1;
        }


        if (!bTime) {
          return -1;
        }


        return (
          new Date(bTime) -
          new Date(aTime)
        );

      }
    );

  }


  /* ==========================================================================
     COUNT
     ========================================================================== */

  function updateConversationCount() {

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
              conversation ===
              activeConversation;


            const unread =
              Number(
                conversation.unreadCount || 0
              );


            return `
              <div
                class="convo-item ${
                  active ? "active" : ""
                }"
                data-user-id="${escapeHTML(
                  user.id
                )}"
              >

                ${avatar(name)}

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

                    ${escapeHTML(
                      preview
                    )}

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
                    style="
                      width:28px;
                      height:28px;
                      border:0;
                      border-radius:8px;
                      background:transparent;
                      cursor:pointer;
                      font-size:18px;
                      line-height:1;
                      color:inherit;
                      opacity:.65;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                    "
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
       OPEN CHAT
       ------------------------------------------------------------------------ */

    convoItems
      .querySelectorAll(
        ".convo-item"
      )
      .forEach(item => {

        item.addEventListener(
          "click",
          async event => {

            /*
             * Don't open chat when
             * remove button was clicked.
             */

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
                  ) ===
                  String(userId)
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
       REMOVE CONNECTION
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

              alert(
                "Connection ID is missing."
              );

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

        console.error(
          "Connection removal failed:",
          error
        );

        throw error;

      }


      /* ----------------------------------------------------------------------
         CLOSE ACTIVE CHAT IF SAME PERSON
         ---------------------------------------------------------------------- */

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


        if (messagesShell) {

          messagesShell.classList.remove(
            "chat-open"
          );

        }


        renderEmptyChat();

      }


      /* ----------------------------------------------------------------------
         REMOVE LOCAL SIDEBAR ITEM
         ---------------------------------------------------------------------- */

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


      console.log(
        "IGCA connection removed:",
        connectionId
      );


    } catch (error) {

      alert(
        error?.message ||
        "Unable to remove connection."
      );

    }

  }


  /* ==========================================================================
     GET / CREATE DIRECT CONVERSATION
     SECURITY DEFINER RPC
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
      String(
        currentUser.id
      ) ===
      String(otherUserId)
    ) {

      throw new Error(
        "You cannot message yourself."
      );

    }


    /* ----------------------------------------------------------------------
       CACHE
       ---------------------------------------------------------------------- */

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


    /* ----------------------------------------------------------------------
       VERIFY ACCEPTED CONNECTION
       ---------------------------------------------------------------------- */

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


    /* ----------------------------------------------------------------------
       SECURE RPC
       ---------------------------------------------------------------------- */

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


    /* ----------------------------------------------------------------------
       UPDATE CACHE
       ---------------------------------------------------------------------- */

    const localConversation =
      conversations.find(
        conversation =>
          String(
            conversation.otherUser?.id
          ) ===
          String(otherUserId)
      );


    if (localConversation) {

      localConversation.conversationId =
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


    if (messagesShell) {

      messagesShell.classList.add(
        "chat-open"
      );

    }


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
        conversation.conversationId;


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


    const messages =
      await IGCA_API.messages(
        activeConversationId
      );


    const user =
      activeOtherUser;


    const name =
      getName(user);


    if (!chatWindow) {
      return;
    }


    chatWindow.innerHTML = `

      <header class="chat-header">

        <div class="chat-header-main">

          ${avatar(
            name,
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

    attachMessageEvents();

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


    return `
      <div
        class="message-row ${
          mine
            ? "mine"
            : "theirs"
        }"
        data-message-id="${escapeHTML(
          message.id || ""
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

        </div>

      </div>
    `;

  }


  /* ==========================================================================
     SEND MESSAGE
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


        appendMessage(
          message
        );


        if (
          activeConversation
        ) {

          activeConversation.lastMessage =
            message;

        }


        sortConversations();

        renderConversationList();

        updateConversationCount();


        /* --------------------------------------------------------------------
           RECEIVER NOTIFICATION
           -------------------------------------------------------------------- */

        const receiverId =
          activeOtherUser?.id;


        if (receiverId) {

          try {

            await createMessageNotification(
              receiverId,
              currentUser?.full_name ||
              currentUser?.username ||
              "IGCA Member",
              text.length > 80
                ? text.substring(
                    0,
                    80
                  ) + "..."
                : text
            );

          } catch (
            notificationError
          ) {

            console.error(
              "Message notification failed:",
              notificationError
            );

          }

        }


        input.value =
          "";

        input.focus();


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
          event.key ===
            "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendMessage();

        }

      }
    );


    input.focus();

  }


  /* ==========================================================================
     MESSAGE NOTIFICATION
     ========================================================================== */

  async function createMessageNotification(
    receiverId,
    senderName,
    messagePreview
  ) {

    if (!receiverId) {
      return;
    }


    const {
      error
    } = await sb
      .from("notifications")
      .insert({

        user_id:
          receiverId,

        title:
          "New message",

        message:
          `${senderName}: ${messagePreview}`,

        type:
          "message",

        is_read:
          false,

        created_at:
          new Date().toISOString()

      });


    if (error) {

      console.error(
        "Message notification insert failed:",
        error
      );

      throw error;

    }

  }


  /* ==========================================================================
     APPEND MESSAGE
     ========================================================================== */

  function appendMessage(
    message
  ) {

    const body =
      document.getElementById(
        "chat-body"
      );


    if (!body) {
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


    if (
      message.id &&
      body.querySelector(
        `[data-message-id="${CSS.escape(
          String(message.id)
        )}"]`
      )
    ) {

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
     ACTIVE CONVERSATION REALTIME
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

      activeMessageChannel =
        null;

    }


    const channelName =
      "igca-active-message-" +
      activeConversationId +
      "-" +
      Date.now();


    activeMessageChannel =
      sb
        .channel(
          channelName
        )
        .on(
          "postgres_changes",
          {
            event:
              "INSERT",

            schema:
              "public",

            table:
              "messages",

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
              String(
                currentUser?.id
              )
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
     GLOBAL MESSAGE REALTIME
     ========================================================================== */

  function subscribeToGlobalMessages() {

    if (
      allMessageChannel
    ) {

      sb.removeChannel(
        allMessageChannel
      );

      allMessageChannel =
        null;

    }


    allMessageChannel =
      sb
        .channel(
          "igca-global-messages-" +
          Date.now()
        )
        .on(
          "postgres_changes",
          {
            event:
              "INSERT",

            schema:
              "public",

            table:
              "messages"

          },
          async payload => {

            const message =
              payload?.new;


            if (!message) {
              return;
            }


            /*
             * Own messages are already rendered.
             */

            if (
              String(
                message.sender_id
              ) ===
              String(
                currentUser?.id
              )
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
             * Conversation may have been
             * created by the other user.
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
                  conversation.unreadCount ||
                  0
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

      notificationChannel =
        null;

    }


    notificationChannel =
      sb
        .channel(
          "igca-message-notifications-" +
          Date.now()
        )
        .on(
          "postgres_changes",
          {
            event:
              "INSERT",

            schema:
              "public",

            table:
              "notifications",

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
     SEARCH
     ========================================================================== */

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      () => {

        const query =
          searchInput.value
            .trim()
            .toLowerCase();


        document
          .querySelectorAll(
            ".convo-item"
          )
          .forEach(
            item => {

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

            }
          );

      }
    );

  }


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


  /* ==========================================================================
     START
     ========================================================================== */

  await loadConversations();

});