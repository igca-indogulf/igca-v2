/* ==========================================================================
   IGCA — Backend API
   Supabase JS v2
   Complete Replacement
   ========================================================================== */

(function () {

  "use strict";


  /* ==========================================================================
     SUPABASE CONFIG
     ========================================================================== */

  const cfg =
    window.IGCA_CONFIG || {};


  if (
    !cfg.SUPABASE_URL ||
    !cfg.SUPABASE_ANON_KEY
  ) {

    console.error(
      "IGCA: Supabase configuration missing."
    );

    return;
  }


  if (!window.supabase) {

    console.error(
      "IGCA: Supabase JS was not loaded."
    );

    return;
  }


  /* ==========================================================================
     SUPABASE CLIENT
     ========================================================================== */

  window.sb =
    window.supabase.createClient(
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


  /* ==========================================================================
     API
     ========================================================================== */

  window.IGCA_API = {


    /* ========================================================================
       AUTH
       ======================================================================== */

    async user() {

      const {
        data,
        error
      } = await sb.auth.getUser();


      if (error) {
        throw error;
      }


      return data?.user || null;
    },


    /* ========================================================================
       PROFILE
       ======================================================================== */

    async profile() {

      const user =
        await this.user();


      if (!user) {
        return null;
      }


      const {
        data,
        error
      } = await sb
        .from("profiles")
        .select("*")
        .eq(
          "id",
          user.id
        )
        .maybeSingle();


      if (error) {
        throw error;
      }


      return data;
    },


    async updateProfile(
      profileData
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      const {
        data,
        error
      } = await sb
        .from("profiles")
        .update(profileData)
        .eq(
          "id",
          user.id
        )
        .select()
        .single();


      if (error) {
        throw error;
      }


      return data;
    },


    /* ========================================================================
       PROFILE SEARCH
       ======================================================================== */

    async searchProfiles(
      q = ""
    ) {

      const user =
        await this.user();


      let request =
        sb
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

        request =
          request.neq(
            "id",
            user.id
          );
      }


      if (q.trim()) {

        const safeQ =
          q
            .trim()
            .replace(
              /[%_]/g,
              "\\$&"
            );


        request =
          request.or(
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
        throw error;
      }


      return data || [];
    },


    /* ========================================================================
       CONNECTION STATUS
       ======================================================================== */

    async connectionStatus(
      otherId
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      if (
        !otherId ||
        user.id === otherId
      ) {

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
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(1)
        .maybeSingle();


      if (error) {
        throw error;
      }


      return data || null;
    },


    /* ========================================================================
       SEND CONNECTION
       ======================================================================== */

    async sendConnection(
      to
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      if (
        !to ||
        user.id === to
      ) {

        throw new Error(
          "Invalid connection target."
        );
      }


      const existing =
        await this.connectionStatus(
          to
        );


      if (
        existing &&
        existing.status === "pending"
      ) {

        return existing;
      }


      if (
        existing &&
        existing.status === "accepted"
      ) {

        throw new Error(
          "Already connected."
        );
      }


      if (
        existing &&
        existing.status === "rejected"
      ) {

        const {
          data,
          error
        } = await sb
          .from("connections")
          .update({
            requester_id:
              user.id,

            addressee_id:
              to,

            status:
              "pending",

            created_at:
              new Date().toISOString()
          })
          .eq(
            "id",
            existing.id
          )
          .select()
          .single();


        if (error) {
          throw error;
        }


        await this.createConnectionNotification(
          to
        );


        return data;
      }


      const {
        data,
        error
      } = await sb
        .from("connections")
        .insert({
          requester_id:
            user.id,

          addressee_id:
            to,

          status:
            "pending"
        })
        .select()
        .single();


      if (error) {
        throw error;
      }


      await this.createConnectionNotification(
        to
      );


      return data;
    },


    /* ========================================================================
       CREATE CONNECTION NOTIFICATION
       ======================================================================== */

    async createConnectionNotification(
      to
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      const {
        error
      } = await sb
        .from("notifications")
        .insert({
          user_id:
            to,

          type:
            "connection",

          title:
            "New connection request",

          message:
            "Someone wants to connect with you.",

          is_read:
            false
        });


      if (error) {
        throw error;
      }


      return true;
    },


    /* ========================================================================
       ACCEPT CONNECTION
       ======================================================================== */

    async acceptConnection(
      connectionId
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      const {
        data: connection,
        error: fetchError
      } = await sb
        .from("connections")
        .select("*")
        .eq(
          "id",
          connectionId
        )
        .eq(
          "addressee_id",
          user.id
        )
        .eq(
          "status",
          "pending"
        )
        .single();


      if (fetchError) {
        throw fetchError;
      }


      const {
        data,
        error
      } = await sb
        .from("connections")
        .update({
          status:
            "accepted"
        })
        .eq(
          "id",
          connectionId
        )
        .select()
        .single();


      if (error) {
        throw error;
      }


      await sb
        .from("notifications")
        .insert({
          user_id:
            connection.requester_id,

          type:
            "connection",

          title:
            "Connection accepted",

          message:
            "Your connection request was accepted.",

          is_read:
            false
        });


      return data;
    },


    /* ========================================================================
       REJECT CONNECTION
       ======================================================================== */

    async rejectConnection(
      connectionId
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      const {
        data: connection,
        error: fetchError
      } = await sb
        .from("connections")
        .select("*")
        .eq(
          "id",
          connectionId
        )
        .eq(
          "addressee_id",
          user.id
        )
        .eq(
          "status",
          "pending"
        )
        .single();


      if (fetchError) {
        throw fetchError;
      }


      const {
        data,
        error
      } = await sb
        .from("connections")
        .update({
          status:
            "rejected"
        })
        .eq(
          "id",
          connectionId
        )
        .select()
        .single();


      if (error) {
        throw error;
      }


      await sb
        .from("notifications")
        .insert({
          user_id:
            connection.requester_id,

          type:
            "connection",

          title:
            "Connection request declined",

          message:
            "Your connection request was declined.",

          is_read:
            false
        });


      return data;
    },


    /* ========================================================================
       ALL CONNECTIONS
       ======================================================================== */

    async connections() {

      const user =
        await this.user();


      if (!user) {
        return [];
      }


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
        .order(
          "created_at",
          {
            ascending: false
          }
        );


      if (error) {
        throw error;
      }


      return data || [];
    },


    /* ========================================================================
       CONVERSATIONS
       ======================================================================== */

    async conversations() {

      const user =
        await this.user();


      if (!user) {
        return [];
      }


      const {
        data: memberships,
        error: membershipError
      } = await sb
        .from("conversation_members")
        .select(
          "conversation_id"
        )
        .eq(
          "user_id",
          user.id
        );


      if (membershipError) {
        throw membershipError;
      }


      if (!memberships?.length) {
        return [];
      }


      const conversationIds =
        memberships
          .map(
            item =>
              item.conversation_id
          )
          .filter(Boolean);


      if (!conversationIds.length) {
        return [];
      }


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
        .order(
          "created_at",
          {
            ascending: false
          }
        );


      if (messagesError) {
        throw messagesError;
      }


      const result = [];


      for (
        const conversationId
        of conversationIds
      ) {

        const conversationMembers =
          members?.filter(
            member =>
              member.conversation_id ===
              conversationId
          ) || [];


        const otherMember =
          conversationMembers.find(
            member =>
              member.user_id !==
              user.id
          );


        if (!otherMember?.profile) {
          continue;
        }


        const conversationMessages =
          messages?.filter(
            message =>
              message.conversation_id ===
              conversationId
          ) || [];


        const latestMessage =
          conversationMessages[0] ||
          null;


        const unreadCount =
          conversationMessages.filter(
            message =>
              message.sender_id !== user.id &&
              !message.read_at
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


      result.sort(
        (a, b) => {

          const aTime =
            a.lastMessage?.created_at ||
            "";

          const bTime =
            b.lastMessage?.created_at ||
            "";


          if (!aTime && !bTime) {
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


      return result;
    },


    /* ========================================================================
       CREATE / GET CONVERSATION
       ======================================================================== */

    async createConversation(
      otherUserId
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      if (!otherUserId) {

        throw new Error(
          "Other user is required."
        );
      }


      if (
        user.id ===
        otherUserId
      ) {

        throw new Error(
          "You cannot message yourself."
        );
      }


      /*
       * Only accepted connections
       * can start messaging.
       */

      const connection =
        await this.connectionStatus(
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


      /*
       * Check existing conversation.
       */

      const {
        data: myMemberships,
        error: myError
      } = await sb
        .from("conversation_members")
        .select(
          "conversation_id"
        )
        .eq(
          "user_id",
          user.id
        );


      if (myError) {
        throw myError;
      }


      const myIds =
        (myMemberships || [])
          .map(
            item =>
              item.conversation_id
          )
          .filter(Boolean);


      if (myIds.length) {

        const {
          data: otherMemberships,
          error: otherError
        } = await sb
          .from("conversation_members")
          .select(
            "conversation_id"
          )
          .eq(
            "user_id",
            otherUserId
          )
          .in(
            "conversation_id",
            myIds
          );


        if (otherError) {
          throw otherError;
        }


        if (
          otherMemberships?.length
        ) {

          return (
            otherMemberships[0]
              .conversation_id
          );
        }
      }


      /*
       * Create conversation.
       */

      const {
        data: conversation,
        error: conversationError
      } = await sb
        .from("conversations")
        .insert({})
        .select("id")
        .single();


      if (conversationError) {
        throw conversationError;
      }


      if (!conversation?.id) {

        throw new Error(
          "Conversation ID was not returned."
        );
      }


      /*
       * Add both members.
       */

      const {
        error: memberError
      } = await sb
        .from("conversation_members")
        .insert([
          {
            conversation_id:
              conversation.id,

            user_id:
              user.id
          },

          {
            conversation_id:
              conversation.id,

            user_id:
              otherUserId
          }
        ]);


      if (memberError) {

        await sb
          .from("conversations")
          .delete()
          .eq(
            "id",
            conversation.id
          );


        throw memberError;
      }


      return conversation.id;
    },


    /* ========================================================================
       MESSAGES
       ======================================================================== */

    async messages(
      conversationId
    ) {

      if (!conversationId) {
        return [];
      }


      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      /*
       * Verify membership.
       */

      const {
        data: membership,
        error: membershipError
      } = await sb
        .from("conversation_members")
        .select(
          "conversation_id"
        )
        .eq(
          "conversation_id",
          conversationId
        )
        .eq(
          "user_id",
          user.id
        )
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
          sender:sender_id(
            full_name
          )
        `)
        .eq(
          "conversation_id",
          conversationId
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


      if (error) {
        throw error;
      }


      return data || [];
    },


    /* ========================================================================
       SEND MESSAGE
       ======================================================================== */

    async sendMessage(
      conversationId,
      body
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      if (!conversationId) {

        throw new Error(
          "Conversation not found."
        );
      }


      const text =
        String(body || "")
          .trim();


      if (!text) {

        throw new Error(
          "Message cannot be empty."
        );
      }


      if (text.length > 5000) {

        throw new Error(
          "Message cannot exceed 5000 characters."
        );
      }


      /*
       * Verify membership.
       */

      const {
        data: membership,
        error: membershipError
      } = await sb
        .from("conversation_members")
        .select(
          "conversation_id"
        )
        .eq(
          "conversation_id",
          conversationId
        )
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();


      if (membershipError) {
        throw membershipError;
      }


      if (!membership) {

        throw new Error(
          "You are not a member of this conversation."
        );
      }


      /*
       * Insert message.
       */

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
        .single();


      if (error) {
        throw error;
      }


      /*
       * Update conversation timestamp.
       */

      const {
        error: updateError
      } = await sb
        .from("conversations")
        .update({
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          conversationId
        );


      if (updateError) {

        console.warn(
          "Conversation timestamp update failed:",
          updateError
        );
      }


      /*
       * Create notification for
       * the other member.
       */

      try {

        const {
          data: otherMembers
        } = await sb
          .from("conversation_members")
          .select("user_id")
          .eq(
            "conversation_id",
            conversationId
          )
          .neq(
            "user_id",
            user.id
          );


        if (
          otherMembers?.length
        ) {

          const notifications =
            otherMembers.map(
              member => ({
                user_id:
                  member.user_id,

                type:
                  "message",

                title:
                  "New message",

                message:
                  text,

                is_read:
                  false
              })
            );


          const {
            error:
              notificationError
          } = await sb
            .from("notifications")
            .insert(
              notifications
            );


          if (notificationError) {

            console.warn(
              "Message notification failed:",
              notificationError
            );
          }
        }

      } catch (notificationError) {

        console.warn(
          "Message notification error:",
          notificationError
        );
      }


      return data;
    },


    /* ========================================================================
       MARK MESSAGES READ
       ======================================================================== */

    async markMessagesRead(
      conversationId
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
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


      if (error) {
        throw error;
      }


      return true;
    },


    /* ========================================================================
       UNREAD MESSAGE COUNT
       ======================================================================== */

    async unreadCount(
      conversationId
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      if (!conversationId) {
        return 0;
      }


      const {
        count,
        error
      } = await sb
        .from("messages")
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true
          }
        )
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


      if (error) {
        throw error;
      }


      return count || 0;
    },


    /* ========================================================================
       REALTIME MESSAGES
       ======================================================================== */

    subscribeMessages(
      conversationId,
      callback
    ) {

      if (!conversationId) {
        return null;
      }


      return sb
        .channel(
          "igca-messages-" +
          conversationId +
          "-" +
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
              "messages",

            filter:
              `conversation_id=eq.${conversationId}`
          },
          callback
        )
        .subscribe(
          status => {

            console.log(
              "IGCA realtime messages:",
              conversationId,
              status
            );

          }
        );
    },


    /* ========================================================================
       NOTIFICATIONS
       ======================================================================== */

    async notifications() {

      const user =
        await this.user();


      if (!user) {
        return [];
      }


      const {
        data,
        error
      } = await sb
        .from("notifications")
        .select(`
          id,
          user_id,
          title,
          message,
          type,
          is_read,
          created_at
        `)
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending:
              false
          }
        )
        .limit(50);


      if (error) {
        throw error;
      }


      return data || [];
    },


    /* ========================================================================
       UNREAD NOTIFICATION COUNT
       ======================================================================== */

    async unreadNotificationCount() {

      const user =
        await this.user();


      if (!user) {
        return 0;
      }


      const {
        count,
        error
      } = await sb
        .from("notifications")
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true
          }
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "is_read",
          false
        );


      if (error) {
        throw error;
      }


      return count || 0;
    },


    /* ========================================================================
       MARK NOTIFICATION READ
       ======================================================================== */

    async markNotificationRead(
      id
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      if (!id) {
        return true;
      }


      const {
        error
      } = await sb
        .from("notifications")
        .update({
          is_read:
            true
        })
        .eq(
          "id",
          id
        )
        .eq(
          "user_id",
          user.id
        );


      if (error) {
        throw error;
      }


      return true;
    },


    /* ========================================================================
       MARK ALL NOTIFICATIONS READ
       ======================================================================== */

    async markAllNotificationsRead() {

      const user =
        await this.user();


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
          is_read:
            true
        })
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "is_read",
          false
        );


      if (error) {
        throw error;
      }


      return true;
    },


    /* ========================================================================
       REALTIME NOTIFICATIONS
       ======================================================================== */

    async subscribeNotifications(
      callback
    ) {

      const user =
        await this.user();


      if (!user) {
        return null;
      }


      const channel =
        sb
          .channel(
            "igca-notifications-" +
            user.id +
            "-" +
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
                `user_id=eq.${user.id}`
            },
            callback
          )
          .subscribe(
            status => {

              console.log(
                "IGCA realtime notifications:",
                status
              );

            }
          );


      return channel;
    },


    /* ========================================================================
       APPOINTMENTS
       ======================================================================== */

    async appointments() {

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
        .order(
          "starts_at",
          {
            ascending:
              true
          }
        );


      if (error) {
        throw error;
      }


      return data || [];
    },


    async requestAppointment(
      recipientId,
      title,
      notes,
      startsAt,
      endsAt
    ) {

      const user =
        await this.user();


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
        .single();


      if (error) {
        throw error;
      }


      return data;
    },


    /* ========================================================================
       POSTS — CREATE
       ======================================================================== */

    async createPost(
      body
    ) {

      const user =
        await this.user();


      if (!user) {

        throw new Error(
          "Not authenticated."
        );
      }


      const text =
        String(body || "")
          .trim();


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
        .single();


      if (error) {
        throw error;
      }


      return data;
    },


    /* ========================================================================
       POSTS — GET FEED
       ======================================================================== */

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
        .order(
          "created_at",
          {
            ascending:
              false
          }
        );


      if (error) {
        throw error;
      }


      return data || [];
    },


    /* ========================================================================
       POSTS — UPDATE
       ======================================================================== */

    async updatePost(
      postId,
      body
    ) {

      const user =
        await this.user();


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
        String(body || "")
          .trim();


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
          body:
            text,

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
        .single();


      if (error) {
        throw error;
      }


      return data;
    },


    /* ========================================================================
       POSTS — DELETE
       ======================================================================== */

    async deletePost(
      postId
    ) {

      const user =
        await this.user();


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


      if (error) {
        throw error;
      }


      return true;
    },


    /* ========================================================================
       POSTS — LIKE
       ======================================================================== */

    async likePost(
      postId
    ) {

      const user =
        await this.user();


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
        .single();


      if (error) {
        throw error;
      }


      return data;
    },


    /* ========================================================================
       POSTS — UNLIKE
       ======================================================================== */

    async unlikePost(
      postId
    ) {

      const user =
        await this.user();


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


      if (error) {
        throw error;
      }


      return true;
    },


    /* ========================================================================
       POSTS — HAS LIKED
       ======================================================================== */

    async hasLikedPost(
      postId
    ) {

      const user =
        await this.user();


      if (!user || !postId) {
        return false;
      }


      const {
        data,
        error
      } = await sb
        .from("post_likes")
        .select(
          "post_id"
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


      if (error) {
        throw error;
      }


      return !!data;
    },


    /* ========================================================================
       POSTS — LIKE COUNT
       ======================================================================== */

    async postLikeCount(
      postId
    ) {

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


      if (error) {
        throw error;
      }


      return count || 0;
    },


    /* ========================================================================
       COMMENTS — GET
       ======================================================================== */

    async comments(
      postId
    ) {

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
        .order(
          "created_at",
          {
            ascending:
              true
          }
        );


      if (error) {
        throw error;
      }


      return data || [];
    },


    /* ========================================================================
       COMMENTS — CREATE
       ======================================================================== */

    async createComment(
      postId,
      body
    ) {

      const user =
        await this.user();


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
        String(body || "")
          .trim();


      if (!text) {

        throw new Error(
          "Comment cannot be empty."
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
        .single();


      if (error) {
        throw error;
      }


      return data;
    },


    /* ========================================================================
       POSTS — REALTIME
       ======================================================================== */

    subscribePosts(
      callback
    ) {

      return sb
        .channel(
          "igca-posts-" +
          Date.now()
        )
        .on(
          "postgres_changes",
          {
            event:
              "*",

            schema:
              "public",

            table:
              "posts"
          },
          callback
        )
        .subscribe();
    },


    /* ========================================================================
       GENERIC CHANNEL REMOVE
       ======================================================================== */

    async removeChannel(
      channel
    ) {

      if (!channel) {
        return;
      }


      await sb.removeChannel(
        channel
      );
    }

  };


  /* ==========================================================================
     READY
     ========================================================================== */

  console.log(
    "IGCA Backend API loaded successfully."
  );

})();