/* ==========================================================================
   IGCA — Backend Client
   Supabase JS v2
   Auth + Connections + Messages + Notifications + Posts + Realtime
   ========================================================================== */

(function () {
  "use strict";

  const cfg = window.IGCA_CONFIG || {};

  /* ------------------------------------------------------------------------
     SUPABASE CONFIG
     ------------------------------------------------------------------------ */

  if (
    !cfg.SUPABASE_URL ||
    cfg.SUPABASE_URL.includes("YOUR-") ||
    !cfg.SUPABASE_ANON_KEY ||
    cfg.SUPABASE_ANON_KEY.includes("YOUR_")
  ) {
    console.warn(
      "IGCA: Configure js/config.js before using the live backend."
    );
  }

  if (!window.supabase) {
    console.error("IGCA: Supabase JS was not loaded.");
    return;
  }

  /* ------------------------------------------------------------------------
     SUPABASE CLIENT
     ------------------------------------------------------------------------ */

  window.sb = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  const sb = window.sb;

  /* ------------------------------------------------------------------------
     AUTH DEBUG
     ------------------------------------------------------------------------ */

  sb.auth.onAuthStateChange((event, session) => {
    console.log(
      "IGCA auth state:",
      event,
      session?.user?.id || null
    );
  });

  /* ------------------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------------------ */

  const NOTIFICATION_TYPES = new Set([
    "connection",
    "message",
    "post",
    "like",
    "comment",
    "appointment",
    "activity"
  ]);

  function normalizeNotificationType(type) {
    const value = String(type || "activity")
      .trim()
      .toLowerCase();

    if (NOTIFICATION_TYPES.has(value)) {
      return value;
    }

    console.warn(
      "IGCA unknown notification type, using activity:",
      value
    );

    return "activity";
  }

  function logSupabaseError(label, error) {
    console.error(`IGCA ${label}:`, {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint
    });
  }

  /* ------------------------------------------------------------------------
     API
     ------------------------------------------------------------------------ */

  window.IGCA_API = {

    /* ======================================================================
       AUTH / USER
       ====================================================================== */

    async user() {
      const {
        data,
        error
      } = await sb.auth.getUser();

      if (error) {
        logSupabaseError("user error", error);
        throw error;
      }

      return data?.user || null;
    },

    async profile() {
      const user = await this.user();

      if (!user) return null;

      const {
        data,
        error
      } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        logSupabaseError("profile error", error);
        throw error;
      }

      return data || null;
    },

    async getProfileById(profileId) {
      if (!profileId) {
        throw new Error("Profile ID is required.");
      }

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
          avatar_url,
          location,
          industry,
          expertise,
          interests,
          company_name,
          website,
          is_verified,
          created_at,
          updated_at,
          phone,
          country
        `)
        .eq("id", profileId)
        .maybeSingle();

      if (error) {
        logSupabaseError("get profile error", error);
        throw error;
      }

      return data || null;
    },

    async updateProfile(profileData) {
      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      const {
        data,
        error
      } = await sb
        .from("profiles")
        .update(profileData)
        .eq("id", user.id)
        .select()
        .maybeSingle();

      if (error) {
        logSupabaseError("update profile error", error);
        throw error;
      }

      return data || null;
    },

    /* ======================================================================
       PROFILE SEARCH
       ====================================================================== */

    async searchProfiles(q = "") {
      const user = await this.user();

      let request = sb
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
        .limit(30);

      if (user) {
        request = request.neq("id", user.id);
      }

      const search = String(q || "").trim();

      if (search) {
        const safeQ = search.replace(/[%_]/g, "\\$&");

        request = request.or(
          `full_name.ilike.%${safeQ}%,` +
          `username.ilike.%${safeQ}%,` +
          `headline.ilike.%${safeQ}%,` +
          `company_name.ilike.%${safeQ}%,` +
          `location.ilike.%${safeQ}%,` +
          `industry.ilike.%${safeQ}%`
        );
      }

      const {
        data,
        error
      } = await request;

      if (error) {
        logSupabaseError("profile search error", error);
        throw error;
      }

      return data || [];
    },

    /* ======================================================================
       NOTIFICATION ACTOR
       ====================================================================== */

    async getNotificationActor() {
      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      const profile = await this.getProfileById(user.id);

      return {
        id: user.id,

        name:
          profile?.full_name ||
          profile?.username ||
          "Someone",

        username:
          profile?.username || null,

        avatar_url:
          profile?.avatar_url || null
      };
    },

    /* ======================================================================
       CREATE NOTIFICATION
       ====================================================================== */

    async createNotification({
      userId,
      type,
      title,
      body = "",
      link = null
    }) {
      const currentUser = await this.user();

      if (!currentUser) {
        throw new Error("Not authenticated.");
      }

      if (!userId) {
        throw new Error("Notification recipient is required.");
      }

      if (currentUser.id === userId) {
        console.log(
          "IGCA notification skipped: cannot notify yourself."
        );

        return null;
      }

      const notificationType =
        normalizeNotificationType(type);

      console.log(
        "IGCA creating notification:",
        {
          from: currentUser.id,
          to: userId,
          type: notificationType,
          title,
          body,
          link
        }
      );

      /*
       * IMPORTANT:
       * The database RPC must cast p_type to notification_type.
       */
      const {
        data,
        error
      } = await sb.rpc(
        "create_notification",
        {
          p_user_id: userId,
          p_type: notificationType,
          p_title: title || "New notification",
          p_body: body || "",
          p_link: link || null
        }
      );

      if (error) {
        logSupabaseError(
          "notification RPC failed",
          error
        );

        throw error;
      }

      console.log(
        "🔔 IGCA notification created:",
        data
      );

      return data;
    },

    /* ======================================================================
       CONNECTION STATUS
       ====================================================================== */

    async connectionStatus(otherId) {
      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      if (!otherId || user.id === otherId) {
        return null;
      }

      const {
        data,
        error
      } = await sb
        .from("connections")
        .select("*")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${otherId}),` +
          `and(requester_id.eq.${otherId},addressee_id.eq.${user.id})`
        )
        .order("created_at", {
          ascending: false
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        logSupabaseError(
          "connection status error",
          error
        );

        throw error;
      }

      return data || null;
    },

    /* ======================================================================
       SEND CONNECTION REQUEST
       ====================================================================== */

    async sendConnection(to) {
      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      if (!to || user.id === to) {
        throw new Error(
          "Invalid connection target."
        );
      }

      const existing =
        await this.connectionStatus(to);

      /*
       * Existing pending request.
       */
      if (existing?.status === "pending") {
        return existing;
      }

      /*
       * Already accepted.
       */
      if (existing?.status === "accepted") {
        throw new Error("Already connected.");
      }

      let connection = null;

      /*
       * Re-use rejected request.
       */
      if (existing?.status === "rejected") {
        const {
          data,
          error
        } = await sb
          .from("connections")
          .update({
            requester_id: user.id,
            addressee_id: to,
            status: "pending",
            created_at: new Date().toISOString()
          })
          .eq("id", existing.id)
          .select()
          .maybeSingle();

        if (error) {
          logSupabaseError(
            "resend connection error",
            error
          );

          throw error;
        }

        if (!data) {
          throw new Error(
            "Connection request could not be recreated."
          );
        }

        connection = data;
      } else {
        /*
         * New request.
         */
        const {
          data,
          error
        } = await sb
          .from("connections")
          .insert({
            requester_id: user.id,
            addressee_id: to,
            status: "pending"
          })
          .select()
          .maybeSingle();

        if (error) {
          logSupabaseError(
            "send connection error",
            error
          );

          throw error;
        }

        if (!data) {
          throw new Error(
            "Connection request was not created."
          );
        }

        connection = data;
      }

      /*
       * IMPORTANT:
       * Create notification AFTER connection is successfully created.
       */
      try {
        await this.createConnectionNotification(to);
      } catch (notificationError) {
        /*
         * Connection itself should remain successful even if
         * notification fails.
         */
        logSupabaseError(
          "connection notification error",
          notificationError
        );
      }

      return connection;
    },

    /* ======================================================================
       CONNECTION REQUEST NOTIFICATION
       ====================================================================== */

    async createConnectionNotification(to) {
      const actor =
        await this.getNotificationActor();

      if (!to || actor.id === to) {
        return null;
      }

      return this.createNotification({
        userId: to,
        type: "connection",
        title: "New connection request",
        body:
          `${actor.name} sent you a connection request.`,
        link: "network.html"
      });
    },

    /* ======================================================================
       ACCEPT CONNECTION
       ====================================================================== */

    async acceptConnection(connectionId) {
      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      if (!connectionId) {
        throw new Error(
          "Connection ID is required."
        );
      }

      /*
       * Fetch pending request.
       *
       * maybeSingle() is intentional.
       * If nothing is found, we handle it ourselves instead of
       * getting PGRST116 from .single().
       */
      const {
        data: connection,
        error: fetchError
      } = await sb
        .from("connections")
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at
        `)
        .eq("id", connectionId)
        .eq("addressee_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (fetchError) {
        logSupabaseError(
          "accept connection fetch error",
          fetchError
        );

        throw fetchError;
      }

      /*
       * This prevents PGRST116 and gives a useful error.
       */
      if (!connection) {
        /*
         * Check whether it was already accepted.
         */
        const {
          data: existing,
          error: existingError
        } = await sb
          .from("connections")
          .select(`
            id,
            requester_id,
            addressee_id,
            status,
            created_at
          `)
          .eq("id", connectionId)
          .eq("addressee_id", user.id)
          .maybeSingle();

        if (existingError) {
          logSupabaseError(
            "accept connection existing check error",
            existingError
          );

          throw existingError;
        }

        if (existing?.status === "accepted") {
          return existing;
        }

        throw new Error(
          "Connection request not found, already handled, or you are not the recipient."
        );
      }

      /*
       * Update pending -> accepted.
       */
      const {
        data,
        error
      } = await sb
        .from("connections")
        .update({
          status: "accepted"
        })
        .eq("id", connection.id)
        .eq("addressee_id", user.id)
        .eq("status", "pending")
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at
        `)
        .maybeSingle();

      if (error) {
        logSupabaseError(
          "accept connection update error",
          error
        );

        throw error;
      }

      /*
       * If another request already changed it, fetch current row.
       */
      const acceptedConnection =
        data || await this.connectionStatus(
          connection.requester_id
        );

      if (!acceptedConnection) {
        throw new Error(
          "Connection was not updated."
        );
      }

      /*
       * Notify original requester.
       */
      try {
        await this.createNotification({
          userId: connection.requester_id,
          type: "connection",
          title: "Connection accepted",
          body:
            "Your connection request was accepted.",
          link: "network.html"
        });
      } catch (notificationError) {
        logSupabaseError(
          "accept connection notification error",
          notificationError
        );
      }

      return acceptedConnection;
    },

    /* ======================================================================
       REJECT CONNECTION
       ====================================================================== */

    async rejectConnection(connectionId) {
      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      if (!connectionId) {
        throw new Error(
          "Connection ID is required."
        );
      }

      const {
        data: connection,
        error: fetchError
      } = await sb
        .from("connections")
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at
        `)
        .eq("id", connectionId)
        .eq("addressee_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (fetchError) {
        logSupabaseError(
          "reject connection fetch error",
          fetchError
        );

        throw fetchError;
      }

      if (!connection) {
        const {
          data: existing,
          error: existingError
        } = await sb
          .from("connections")
          .select(`
            id,
            requester_id,
            addressee_id,
            status,
            created_at
          `)
          .eq("id", connectionId)
          .eq("addressee_id", user.id)
          .maybeSingle();

        if (existingError) {
          logSupabaseError(
            "reject connection existing check error",
            existingError
          );

          throw existingError;
        }

        if (existing?.status === "rejected") {
          return existing;
        }

        throw new Error(
          "Connection request not found or already handled."
        );
      }

      const {
        data,
        error
      } = await sb
        .from("connections")
        .update({
          status: "rejected"
        })
        .eq("id", connection.id)
        .eq("addressee_id", user.id)
        .eq("status", "pending")
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at
        `)
        .maybeSingle();

      if (error) {
        logSupabaseError(
          "reject connection update error",
          error
        );

        throw error;
      }

      const rejectedConnection =
        data || {
          ...connection,
          status: "rejected"
        };

      try {
        await this.createNotification({
          userId: connection.requester_id,
          type: "connection",
          title: "Connection request declined",
          body:
            "Your connection request was declined.",
          link: "network.html"
        });
      } catch (notificationError) {
        logSupabaseError(
          "reject connection notification error",
          notificationError
        );
      }

      return rejectedConnection;
    },

    /* ======================================================================
       ALL CONNECTIONS
       ====================================================================== */

    async connections() {
      const user = await this.user();

      if (!user) return [];

      const {
        data,
        error
      } = await sb
        .from("connections")
        .select(`
          *,
          requester:requester_id(
            id,
            full_name,
            username,
            headline,
            account_type,
            avatar_url
          ),
          addressee:addressee_id(
            id,
            full_name,
            username,
            headline,
            account_type,
            avatar_url
          )
        `)
        .or(
          `requester_id.eq.${user.id},addressee_id.eq.${user.id}`
        )
        .order("created_at", {
          ascending: false
        });

      if (error) {
        logSupabaseError(
          "connections error",
          error
        );

        throw error;
      }

      return data || [];
    },

    /* ======================================================================
       CONVERSATIONS
       ====================================================================== */

    async conversations() {
      const user = await this.user();

      if (!user) return [];

      const {
        data: memberships,
        error: membershipError
      } = await sb
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (membershipError) {
        throw membershipError;
      }

      if (!memberships?.length) {
        return [];
      }

      const conversationIds =
        memberships.map(
          x => x.conversation_id
        );

      const {
        data: members,
        error: membersError
      } = await sb
        .from("conversation_members")
        .select(`
          conversation_id,
          user_id,
          profile:user_id(
            id,
            full_name,
            username,
            headline,
            account_type,
            avatar_url
          )
        `)
        .in(
          "conversation_id",
          conversationIds
        );

      if (membersError) {
        throw membersError;
      }

      const {
        data: messages,
        error: messagesError
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
        .order("created_at", {
          ascending: false
        });

      if (messagesError) {
        throw messagesError;
      }

      const result = [];

      for (const conversationId of conversationIds) {
        const conversationMembers =
          members?.filter(
            m =>
              m.conversation_id ===
              conversationId
          ) || [];

        const otherMember =
          conversationMembers.find(
            m =>
              m.user_id !== user.id
          );

        if (!otherMember?.profile) {
          continue;
        }

        const conversationMessages =
          messages?.filter(
            m =>
              m.conversation_id ===
              conversationId
          ) || [];

        const latestMessage =
          conversationMessages[0] || null;

        const unreadCount =
          conversationMessages.filter(
            m =>
              m.sender_id !== user.id &&
              !m.read_at
          ).length;

        result.push({
          conversationId,
          otherUser:
            otherMember.profile,
          lastMessage:
            latestMessage,
          unreadCount
        });
      }

      result.sort((a, b) => {
        const aTime =
          a.lastMessage?.created_at || "";

        const bTime =
          b.lastMessage?.created_at || "";

        if (!aTime && !bTime) return 0;
        if (!aTime) return 1;
        if (!bTime) return -1;

        return (
          new Date(bTime) -
          new Date(aTime)
        );
      });

      return result;
    },

    /* ======================================================================
       CREATE CONVERSATION
       ====================================================================== */

    async createConversation(otherUserId) {
      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      if (!otherUserId) {
        throw new Error(
          "Other user is required."
        );
      }

      if (user.id === otherUserId) {
        throw new Error(
          "You cannot message yourself."
        );
      }

      const {
        data,
        error
      } = await sb.rpc(
        "create_direct_conversation",
        {
          p_other_user_id: otherUserId
        }
      );

      if (error) {
        logSupabaseError(
          "create conversation error",
          error
        );

        throw error;
      }

      if (!data) {
        throw new Error(
          "Unable to create conversation."
        );
      }

      return data;
    },

    /* ======================================================================
       MESSAGES
       ====================================================================== */

    async messages(conversationId) {
      if (!conversationId) {
        return [];
      }

      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      const {
        data: membership,
        error: membershipError
      } = await sb
        .from("conversation_members")
        .select("conversation_id")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      if (!membership) {
        throw new Error(
          "You are not a member of this conversation."
        );
      }

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
          read_at,
          sender:sender_id(full_name)
        `)
        .eq(
          "conversation_id",
          conversationId
        )
        .order("created_at", {
          ascending: true
        });

      if (error) throw error;

      return data || [];
    },

    /* ======================================================================
       SEND MESSAGE + NOTIFICATION
       ====================================================================== */

    async sendMessage(
      conversationId,
      body
    ) {
      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      const text =
        String(body || "").trim();

      if (!conversationId) {
        throw new Error(
          "Conversation not found."
        );
      }

      if (!text) {
        throw new Error(
          "Message cannot be empty."
        );
      }

      const {
        data: membership,
        error: membershipError
      } = await sb
        .from("conversation_members")
        .select("conversation_id")
        .eq(
          "conversation_id",
          conversationId
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      if (!membership) {
        throw new Error(
          "You are not a member of this conversation."
        );
      }

      const {
        data: otherMember,
        error: otherMemberError
      } = await sb
        .from("conversation_members")
        .select("user_id")
        .eq(
          "conversation_id",
          conversationId
        )
        .neq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (otherMemberError) {
        throw otherMemberError;
      }

      const {
        data,
        error
      } = await sb
        .from("messages")
        .insert({
          conversation_id:
            conversationId,
          sender_id:
            user.id,
          body:
            text
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          body,
          created_at,
          read_at
        `)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "Message was not created."
        );
      }

      await sb
        .from("conversations")
        .update({
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          conversationId
        );

      /*
       * Message notification.
       */
      if (otherMember?.user_id) {
        try {
          const actor =
            await this.getNotificationActor();

          await this.createNotification({
            userId:
              otherMember.user_id,

            type:
              "message",

            title:
              "New message",

            body:
              `${actor.name}: ${text}`,

            link:
              `messages.html?conversation=${encodeURIComponent(
                conversationId
              )}`
          });
        } catch (notificationError) {
          logSupabaseError(
            "message notification error",
            notificationError
          );
        }
      }

      return data;
    },

    /* ======================================================================
       MARK MESSAGES READ
       ====================================================================== */

    async markMessagesRead(conversationId) {
      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      if (!conversationId) {
        return true;
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
          user.id
        )
        .is(
          "read_at",
          null
        );

      if (error) throw error;

      return true;
    },

    /* ======================================================================
       MESSAGE UNREAD COUNT
       ====================================================================== */

    async unreadCount(conversationId) {
      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      if (!conversationId) {
        return 0;
      }

      const {
        count,
        error
      } = await sb
        .from("messages")
        .select("id", {
          count: "exact",
          head: true
        })
        .eq(
          "conversation_id",
          conversationId
        )
        .neq(
          "sender_id",
          user.id
        )
        .is(
          "read_at",
          null
        );

      if (error) throw error;

      return count || 0;
    },

    /* ======================================================================
       REALTIME — MESSAGES
       ====================================================================== */

    subscribeMessages(
      conversationId,
      callback
    ) {
      if (!conversationId) {
        return null;
      }

      return sb
        .channel(
          `igca-messages-${conversationId}-${Date.now()}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter:
              `conversation_id=eq.${conversationId}`
          },
          callback
        )
        .subscribe(status => {
          console.log(
            "IGCA message realtime:",
            conversationId,
            status
          );
        });
    },

    /* ======================================================================
       NOTIFICATIONS
       ====================================================================== */

    async notifications() {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "No authenticated user found. Please login again."
        );
      }

      console.log(
        "IGCA loading notifications for:",
        user.id
      );

      const {
        data,
        error
      } = await sb
        .from("notifications")
        .select(`
          id,
          user_id,
          type,
          title,
          body,
          link,
          read_at,
          created_at
        `)
        .eq(
          "user_id",
          user.id
        )
        .order("created_at", {
          ascending: false
        })
        .limit(100);

      if (error) {
        logSupabaseError(
          "notifications error",
          error
        );

        throw error;
      }

      const ownNotifications =
        (data || []).filter(
          notification =>
            notification.user_id === user.id
        );

      console.log(
        "IGCA own notifications:",
        ownNotifications
      );

      return ownNotifications;
    },

    /* ======================================================================
       UNREAD NOTIFICATION COUNT
       ====================================================================== */

    async unreadNotificationCount() {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "Not authenticated."
        );
      }

      const {
        count,
        error
      } = await sb
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true
        })
        .eq(
          "user_id",
          user.id
        )
        .is(
          "read_at",
          null
        );

      if (error) throw error;

      return count || 0;
    },

    /* ======================================================================
       MARK ONE NOTIFICATION READ
       ====================================================================== */

    async markNotificationRead(id) {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "Not authenticated."
        );
      }

      if (!id) {
        throw new Error(
          "Notification ID is required."
        );
      }

      const {
        error
      } = await sb
        .from("notifications")
        .update({
          read_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          id
        )
        .eq(
          "user_id",
          user.id
        )
        .is(
          "read_at",
          null
        );

      if (error) throw error;

      return true;
    },

    /* ======================================================================
       MARK ALL NOTIFICATIONS READ
       ====================================================================== */

    async markAllNotificationsRead() {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "Not authenticated."
        );
      }

      const {
        error
      } = await sb
        .from("notifications")
        .update({
          read_at:
            new Date().toISOString()
        })
        .eq(
          "user_id",
          user.id
        )
        .is(
          "read_at",
          null
        );

      if (error) throw error;

      return true;
    },

    /* ======================================================================
       REALTIME — NOTIFICATIONS
       ====================================================================== */

    async subscribeNotifications(callback) {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "Cannot subscribe without authenticated user."
        );
      }

      const channelName =
        `igca-notifications-${user.id}-${Date.now()}`;

      console.log(
        "🔔 Subscribing notifications for USER:",
        user.id
      );

      const channel =
        sb
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter:
                `user_id=eq.${user.id}`
            },
            payload => {
              console.log(
                "🔔 REALTIME NOTIFICATION:",
                payload
              );

              if (
                payload?.new?.user_id !== user.id
              ) {
                console.warn(
                  "IGCA ignored notification for another user."
                );

                return;
              }

              window.dispatchEvent(
                new CustomEvent(
                  "igca:new-notification",
                  {
                    detail: payload
                  }
                )
              );

              if (
                typeof callback ===
                "function"
              ) {
                callback(payload);
              }
            }
          )
          .subscribe(status => {
            console.log(
              "IGCA notification realtime status:",
              user.id,
              status
            );
          });

      return channel;
    },

    /* ======================================================================
       REALTIME — NOTIFICATION CLEANUP
       ====================================================================== */

    async unsubscribeNotifications(channel) {
      if (!channel) {
        return;
      }

      try {
        await sb.removeChannel(channel);

        console.log(
          "IGCA notification realtime unsubscribed."
        );
      } catch (error) {
        console.error(
          "IGCA notification cleanup error:",
          error
        );
      }
    },

    /* ======================================================================
       POSTS
       ====================================================================== */

    async createPost(body) {
      const user = await this.user();

      if (!user) {
        throw new Error("Not authenticated.");
      }

      const text =
        String(body || "").trim();

      if (!text) {
        throw new Error(
          "Post cannot be empty."
        );
      }

      const {
        data,
        error
      } = await sb
        .from("posts")
        .insert({
          author_id:
            user.id,
          body:
            text
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "Post was not created."
        );
      }

      try {
        const {
          data: connections,
          error: connectionError
        } = await sb
          .from("connections")
          .select(`
            requester_id,
            addressee_id
          `)
          .or(
            `requester_id.eq.${user.id},addressee_id.eq.${user.id}`
          )
          .eq(
            "status",
            "accepted"
          );

        if (connectionError) {
          console.error(
            "IGCA post connection lookup failed:",
            connectionError
          );

          return data;
        }

        const actor =
          await this.getNotificationActor();

        const recipients = [
          ...new Set(
            (connections || [])
              .map(connection => {
                return connection.requester_id ===
                  user.id
                  ? connection.addressee_id
                  : connection.requester_id;
              })
              .filter(
                id =>
                  id &&
                  id !== user.id
              )
          )
        ];

        await Promise.all(
          recipients.map(recipientId =>
            this
              .createNotification({
                userId:
                  recipientId,

                type:
                  "post",

                title:
                  "New post",

                body:
                  `${actor.name} published a new post.`,

                link:
                  `index.html#post-${data.id}`
              })
              .catch(notificationError => {
                console.error(
                  "IGCA new post notification failed:",
                  recipientId,
                  notificationError
                );

                return null;
              })
          )
        );
      } catch (notificationError) {
        console.error(
          "IGCA post notification process failed:",
          notificationError
        );
      }

      return data;
    },

    async posts() {
      const {
        data,
        error
      } = await sb
        .from("posts")
        .select(`
          id,
          author_id,
          body,
          created_at,
          updated_at,
          author:author_id(
            id,
            full_name,
            username,
            headline,
            avatar_url,
            account_type,
            is_verified
          )
        `)
        .order("created_at", {
          ascending: false
        });

      if (error) throw error;

      return data || [];
    },

    async updatePost(postId, body) {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "Not authenticated."
        );
      }

      const text =
        String(body || "").trim();

      if (!postId) {
        throw new Error(
          "Post ID is required."
        );
      }

      if (!text) {
        throw new Error(
          "Post cannot be empty."
        );
      }

      const {
        data,
        error
      } = await sb
        .from("posts")
        .update({
          body: text,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          postId
        )
        .eq(
          "author_id",
          user.id
        )
        .select()
        .maybeSingle();

      if (error) throw error;

      return data || null;
    },

    async deletePost(postId) {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "Not authenticated."
        );
      }

      if (!postId) {
        throw new Error(
          "Post ID is required."
        );
      }

      const {
        error
      } = await sb
        .from("posts")
        .delete()
        .eq(
          "id",
          postId
        )
        .eq(
          "author_id",
          user.id
        );

      if (error) throw error;

      return true;
    },

    /* ======================================================================
       LIKE POST + NOTIFICATION
       ====================================================================== */

    async likePost(postId) {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "Not authenticated."
        );
      }

      if (!postId) {
        throw new Error(
          "Post ID is required."
        );
      }

      const {
        data: post,
        error: postError
      } = await sb
        .from("posts")
        .select("id, author_id")
        .eq(
          "id",
          postId
        )
        .maybeSingle();

      if (postError) throw postError;

      if (!post) {
        throw new Error(
          "Post not found."
        );
      }

      const {
        data: existing,
        error: existingError
      } = await sb
        .from("post_likes")
        .select(
          "post_id, user_id"
        )
        .eq(
          "post_id",
          postId
        )
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existing) {
        return existing;
      }

      const {
        data,
        error
      } = await sb
        .from("post_likes")
        .insert({
          post_id:
            postId,
          user_id:
            user.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "Like was not created."
        );
      }

      if (post.author_id !== user.id) {
        try {
          const actor =
            await this.getNotificationActor();

          await this.createNotification({
            userId:
              post.author_id,

            type:
              "like",

            title:
              "New like",

            body:
              `${actor.name} liked your post.`,

            link:
              `index.html#post-${postId}`
          });
        } catch (notificationError) {
          console.error(
            "IGCA like notification failed:",
            notificationError
          );
        }
      }

      return data;
    },

    async unlikePost(postId) {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "Not authenticated."
        );
      }

      const {
        error
      } = await sb
        .from("post_likes")
        .delete()
        .eq(
          "post_id",
          postId
        )
        .eq(
          "user_id",
          user.id
        );

      if (error) throw error;

      return true;
    },

    async hasLikedPost(postId) {
      const user = await this.user();

      if (!user || !postId) {
        return false;
      }

      const {
        data,
        error
      } = await sb
        .from("post_likes")
        .select("post_id")
        .eq(
          "post_id",
          postId
        )
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();

      if (error) throw error;

      return !!data;
    },

    async postLikeCount(postId) {
      if (!postId) {
        return 0;
      }

      const {
        count,
        error
      } = await sb
        .from("post_likes")
        .select(
          "post_id",
          {
            count:
              "exact",
            head:
              true
          }
        )
        .eq(
          "post_id",
          postId
        );

      if (error) throw error;

      return count || 0;
    },

    /* ======================================================================
       COMMENTS
       ====================================================================== */

    async comments(postId) {
      if (!postId) {
        return [];
      }

      const {
        data,
        error
      } = await sb
        .from("comments")
        .select(`
          id,
          post_id,
          author_id,
          body,
          created_at,
          author:author_id(
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq(
          "post_id",
          postId
        )
        .order("created_at", {
          ascending: true
        });

      if (error) throw error;

      return data || [];
    },

    /* ======================================================================
       CREATE COMMENT + NOTIFICATION
       ====================================================================== */

    async createComment(postId, body) {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "Not authenticated."
        );
      }

      if (!postId) {
        throw new Error(
          "Post ID is required."
        );
      }

      const text =
        String(body || "").trim();

      if (!text) {
        throw new Error(
          "Comment cannot be empty."
        );
      }

      const {
        data: post,
        error: postError
      } = await sb
        .from("posts")
        .select("id, author_id")
        .eq(
          "id",
          postId
        )
        .maybeSingle();

      if (postError) throw postError;

      if (!post) {
        throw new Error(
          "Post not found."
        );
      }

      const {
        data,
        error
      } = await sb
        .from("comments")
        .insert({
          post_id:
            postId,
          author_id:
            user.id,
          body:
            text
        })
        .select(`
          id,
          post_id,
          author_id,
          body,
          created_at,
          author:author_id(
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "Comment was not created."
        );
      }

      if (post.author_id !== user.id) {
        try {
          const actor =
            await this.getNotificationActor();

          await this.createNotification({
            userId:
              post.author_id,

            type:
              "comment",

            title:
              "New comment",

            body:
              `${actor.name} commented on your post.`,

            link:
              `index.html#post-${postId}`
          });
        } catch (notificationError) {
          console.error(
            "IGCA comment notification failed:",
            notificationError
          );
        }
      }

      return data;
    },

    /* ======================================================================
       POSTS REALTIME
       ====================================================================== */

    subscribePosts(callback) {
      return sb
        .channel(
          `igca-posts-${Date.now()}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "posts"
          },
          callback
        )
        .subscribe(status => {
          console.log(
            "IGCA posts realtime:",
            status
          );
        });
    },

    /* ======================================================================
       APPOINTMENTS
       ====================================================================== */

    async appointments() {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "Not authenticated."
        );
      }

      const {
        data,
        error
      } = await sb
        .from("appointments")
        .select(`
          *,
          requester:requester_id(full_name),
          recipient:recipient_id(full_name)
        `)
        .or(
          `requester_id.eq.${user.id},recipient_id.eq.${user.id}`
        )
        .order("starts_at", {
          ascending: true
        });

      if (error) throw error;

      return data || [];
    },

    /* ======================================================================
       REQUEST APPOINTMENT + NOTIFICATION
       ====================================================================== */

    async requestAppointment(
      recipientId,
      title,
      notes,
      startsAt,
      endsAt
    ) {
      const user = await this.user();

      if (!user) {
        throw new Error(
          "Not authenticated."
        );
      }

      if (
        !recipientId ||
        recipientId === user.id
      ) {
        throw new Error(
          "Invalid appointment recipient."
        );
      }

      const {
        data,
        error
      } = await sb
        .from("appointments")
        .insert({
          requester_id:
            user.id,

          recipient_id:
            recipientId,

          title,
          notes,

          starts_at:
            startsAt,

          ends_at:
            endsAt
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "Appointment was not created."
        );
      }

      try {
        const actor =
          await this.getNotificationActor();

        await this.createNotification({
          userId:
            recipientId,

          type:
            "appointment",

          title:
            "New appointment request",

          body:
            `${actor.name} sent you an appointment request.`,

          link:
            "appointments.html"
        });
      } catch (notificationError) {
        console.error(
          "IGCA appointment notification failed:",
          notificationError
        );
      }

      return data;
    }
  };

  /* ------------------------------------------------------------------------
     READY
     ------------------------------------------------------------------------ */

  console.log(
    "IGCA Backend API loaded successfully."
  );

})();
