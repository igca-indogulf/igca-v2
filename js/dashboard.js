/* ==========================================================================
   IGCA — DASHBOARD
   LIVE SUPABASE DASHBOARD
   Posts + Likes + Comments + Connections + Messages + Appointments
   Realtime
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  "use strict";


  /* ==========================================================================
     SHELL
     ========================================================================== */

  try {

    if (
      window.App &&
      typeof App.mountShell === "function"
    ) {

      App.mountShell("dashboard.html");

    }

  } catch (error) {

    console.error(
      "IGCA Dashboard Shell Error:",
      error
    );

  }


  /* ==========================================================================
     ELEMENTS
     ========================================================================== */

  const greeting =
    document.getElementById("greeting");

  const dashboardAvatar =
    document.getElementById(
      "dashboard-post-avatar"
    );

  const feedList =
    document.getElementById(
      "dashboard-feed-list"
    );

  const peopleContainer =
    document.getElementById(
      "dash-people"
    );

  const opportunitiesContainer =
    document.getElementById(
      "dash-opps"
    );

  const insightsContainer =
    document.getElementById(
      "dash-insights"
    );

  const learnContainer =
    document.getElementById(
      "dash-learn"
    );

  const trendingContainer =
    document.getElementById(
      "dashboard-trending-topics"
    );

  const statConnections =
    document.getElementById(
      "stat-connections"
    );

  const statPending =
    document.getElementById(
      "stat-pending"
    );

  const statMeetings =
    document.getElementById(
      "stat-meetings"
    );

  const statMessages =
    document.getElementById(
      "stat-messages"
    );

  const searchInput =
    document.getElementById(
      "dashboard-search-input"
    );

  const searchButton =
    document.getElementById(
      "dashboard-search-button"
    );


  /* ==========================================================================
     SUPABASE
     ========================================================================== */

  if (!window.sb) {

    console.error(
      "IGCA Dashboard: Supabase client 'sb' unavailable."
    );

    if (feedList) {

      feedList.innerHTML = `
        <div class="dashboard-feed-error">
          <h3>Dashboard unavailable</h3>
          <p>
            Supabase could not be initialized.
            Check config.js and backend.js.
          </p>
        </div>
      `;

    }

    return;

  }


  /* ==========================================================================
     STATE
     ========================================================================== */

  let currentUser = null;

  let realtimeChannel = null;

  let searchTimer = null;

  let currentPosts = [];


  /* ==========================================================================
     HELPERS
     ========================================================================== */

  function normalize(value) {

    return String(value ?? "")
      .trim()
      .toLowerCase();

  }


  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function initials(name) {

    const value =
      String(name || "IGCA")
        .trim();

    if (!value) {
      return "IG";
    }

    return value
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase();

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

    const now =
      new Date();

    const diff =
      now.getTime() -
      date.getTime();

    const minute =
      60 * 1000;

    const hour =
      60 * minute;

    const day =
      24 * hour;

    if (diff < minute) {
      return "Just now";
    }

    if (diff < hour) {

      return (
        Math.floor(diff / minute) +
        "m ago"
      );

    }

    if (diff < day) {

      return (
        Math.floor(diff / hour) +
        "h ago"
      );

    }

    if (diff < 7 * day) {

      return (
        Math.floor(diff / day) +
        "d ago"
      );

    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );

  }


  function arrayValue(value) {

    if (Array.isArray(value)) {
      return value;
    }

    if (
      typeof value !==
      "string"
    ) {
      return [];
    }

    return value
      .split(",")
      .map(item =>
        item.trim()
      )
      .filter(Boolean);

  }


  function intersection(a, b) {

    const first =
      a.map(normalize);

    const second =
      b.map(normalize);

    return first.filter(
      value =>
        value &&
        second.includes(value)
    );

  }


  /* ==========================================================================
     CURRENT USER
     ========================================================================== */

  async function loadCurrentUser() {

    try {

      if (
        window.IGCA_API &&
        typeof IGCA_API.profile ===
          "function"
      ) {

        currentUser =
          await IGCA_API.profile();

      }

      if (
        !currentUser?.id
      ) {

        const {
          data: {
            user
          } = {}
        } =
          await sb.auth.getUser();

        if (user?.id) {

          const {
            data: profile
          } = await sb
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          currentUser =
            profile || {
              id: user.id
            };

        }

      }

    } catch (error) {

      console.error(
        "Dashboard current user error:",
        error
      );

      currentUser = null;

    }


    updateGreeting();

    updateComposerAvatar();

  }


  /* ==========================================================================
     GREETING
     ========================================================================== */

  function updateGreeting() {

    if (!greeting) {
      return;
    }

    const name =
      currentUser?.full_name ||
      currentUser?.username ||
      "there";

    const hour =
      new Date().getHours();

    let text =
      "Good morning";

    if (
      hour >= 12 &&
      hour < 17
    ) {

      text =
        "Good afternoon";

    }

    if (
      hour >= 17
    ) {

      text =
        "Good evening";

    }

    greeting.textContent =
      `${text}, ${name} 👋`;

  }


  /* ==========================================================================
     COMPOSER AVATAR
     ========================================================================== */

  function updateComposerAvatar() {

    if (!dashboardAvatar) {
      return;
    }

    const name =
      currentUser?.full_name ||
      currentUser?.username ||
      "IGCA";

    const avatar =
      currentUser?.avatar_url;

    if (avatar) {

      dashboardAvatar.innerHTML = `
        <img
          src="${escapeHTML(avatar)}"
          alt="${escapeHTML(name)}"
          onerror="
            this.style.display='none';
            this.parentElement.textContent='${escapeHTML(
              initials(name)
            )}';
          "
        >
      `;

    } else {

      dashboardAvatar.textContent =
        initials(name);

    }

  }


  /* ==========================================================================
     STATS
     ========================================================================== */

  async function loadStats() {

    if (!currentUser?.id) {
      return;
    }

    try {

      /* ----------------------------------------------------------------------
         CONNECTIONS
      ---------------------------------------------------------------------- */

      const {
        data: connections,
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
        );

      if (connectionError) {
        throw connectionError;
      }

      const rows =
        connections || [];

      const accepted =
        rows.filter(
          row =>
            normalize(
              row.status
            ) === "accepted"
        );

      const pending =
        rows.filter(
          row =>
            normalize(
              row.status
            ) === "pending" &&
            row.addressee_id ===
              currentUser.id
        );

      if (statConnections) {

        statConnections.textContent =
          accepted.length;

      }

      if (statPending) {

        statPending.textContent =
          pending.length;

      }


      /* ----------------------------------------------------------------------
         APPOINTMENTS
      ---------------------------------------------------------------------- */

      const now =
        new Date()
          .toISOString();

      const {
        data: appointments,
        error: appointmentError
      } = await sb
        .from("appointments")
        .select(`
          id,
          requester_id,
          recipient_id,
          starts_at,
          ends_at,
          title,
          status
        `)
        .or(
          `requester_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`
        )
        .gte(
          "starts_at",
          now
        )
        .order(
          "starts_at",
          {
            ascending: true
          }
        );

      if (appointmentError) {

        console.error(
          "Appointments error:",
          appointmentError
        );

        if (statMeetings) {
          statMeetings.textContent =
            "0";
        }

      } else {

        const upcoming =
          (appointments || [])
            .filter(item => {

              const status =
                normalize(
                  item.status
                );

              if (!status) {
                return true;
              }

              return [
                "pending",
                "accepted",
                "confirmed",
                "scheduled"
              ].includes(status);

            });

        if (statMeetings) {

          statMeetings.textContent =
            upcoming.length;

        }

      }


      /* ----------------------------------------------------------------------
         UNREAD MESSAGES
      ---------------------------------------------------------------------- */

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
          currentUser.id
        );

      if (membershipError) {

        console.error(
          "Conversation members error:",
          membershipError
        );

        if (statMessages) {
          statMessages.textContent =
            "0";
        }

        return;

      }

      const conversationIds =
        (memberships || [])
          .map(
            item =>
              item.conversation_id
          )
          .filter(Boolean);

      if (!conversationIds.length) {

        if (statMessages) {
          statMessages.textContent =
            "0";
        }

        return;

      }

      const {
        count,
        error: messageError
      } = await sb
        .from("messages")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .in(
          "conversation_id",
          conversationIds
        )
        .neq(
          "sender_id",
          currentUser.id
        )
        .is(
          "read_at",
          null
        );

      if (messageError) {

        console.error(
          "Unread messages error:",
          messageError
        );

        if (statMessages) {
          statMessages.textContent =
            "0";
        }

      } else {

        if (statMessages) {

          statMessages.textContent =
            count || 0;

        }

      }

    } catch (error) {

      console.error(
        "Dashboard stats error:",
        error
      );

    }

  }


  /* ==========================================================================
     LOAD POSTS
     ========================================================================== */

  async function loadFeed() {

    if (!feedList) {
      return;
    }

    feedList.innerHTML = `
      <div class="dashboard-feed-loading">
        <div class="loading-line"></div>
        <div class="loading-line short"></div>
      </div>

      <div class="dashboard-feed-loading">
        <div class="loading-line"></div>
        <div class="loading-line short"></div>
      </div>
    `;


    try {

      const {
        data: posts,
        error
      } = await sb
        .from("posts")
        .select(`
          id,
          author_id,
          body,
          created_at,
          updated_at,
          profiles:author_id (
            id,
            full_name,
            username,
            headline,
            company_name,
            avatar_url,
            is_verified
          )
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(20);

      if (error) {
        throw error;
      }

      const rows =
        posts || [];

      if (!rows.length) {

        currentPosts = [];

        feedList.innerHTML = `
          <div class="dashboard-feed-empty">
            <h3>No posts yet</h3>
            <p>
              Your network hasn't shared anything yet.
              Be the first person to share an update.
            </p>
          </div>
        `;

        return;

      }


      /* ----------------------------------------------------------------------
         LOAD LIKE COUNTS
      ---------------------------------------------------------------------- */

      const postIds =
        rows
          .map(post => post.id)
          .filter(Boolean);

      let likeRows = [];

      if (postIds.length) {

        const {
          data,
          error: likeError
        } = await sb
          .from("post_likes")
          .select(
            "post_id,user_id"
          )
          .in(
            "post_id",
            postIds
          );

        if (likeError) {

          console.warn(
            "Like count lookup failed:",
            likeError
          );

        } else {

          likeRows =
            data || [];

        }

      }


      /* ----------------------------------------------------------------------
         LOAD COMMENT COUNTS
      ---------------------------------------------------------------------- */

      let commentRows = [];

      if (postIds.length) {

        const {
          data,
          error: commentError
        } = await sb
          .from("comments")
          .select(
            "id,post_id"
          )
          .in(
            "post_id",
            postIds
          );

        if (commentError) {

          console.warn(
            "Comment count lookup failed:",
            commentError
          );

        } else {

          commentRows =
            data || [];

        }

      }


      /* ----------------------------------------------------------------------
         MERGE
      ---------------------------------------------------------------------- */
const dashboardRows = rows.slice(0, 4);
      currentPosts =
  dashboardRows.map(post => {

          const likes =
            likeRows.filter(
              item =>
                item.post_id ===
                post.id
            );

          const comments =
            commentRows.filter(
              item =>
                item.post_id ===
                post.id
            );

          return {

            ...post,

            like_count:
              likes.length,

            comment_count:
              comments.length,

            liked_by_me:
              currentUser?.id
                ? likes.some(
                    item =>
                      item.user_id ===
                      currentUser.id
                  )
                : false

          };

        });


      renderFeed();

    } catch (error) {

      console.error(
        "Dashboard feed error:",
        error
      );

      feedList.innerHTML = `
        <div class="dashboard-feed-error">

          <h3>
            Feed unavailable
          </h3>

          <p>
            ${escapeHTML(
              error?.message ||
              "Unable to load network feed."
            )}
          </p>

        </div>
      `;

    }

  }


  /* ==========================================================================
     RENDER FEED
     ========================================================================== */

  function renderFeed() {

    if (!feedList) {
      return;
    }

    if (!currentPosts.length) {

      feedList.innerHTML = `
        <div class="dashboard-feed-empty">
          <h3>No posts yet</h3>
          <p>
            Your professional network hasn't shared anything yet.
          </p>
        </div>
      `;

      return;

    }

    feedList.innerHTML =
      currentPosts
        .map(
          post =>
            renderPost(post)
        )
        .join("");

  }


  /* ==========================================================================
     RENDER POST
     ========================================================================== */

  function renderPost(post) {

    const profile =
      post.profiles || {};

    const name =
      profile.full_name ||
      profile.username ||
      "IGCA Member";

    const headline =
      profile.headline ||
      profile.company_name ||
      "Professional";

    const avatar =
      profile.avatar_url;

    let avatarHTML;

    if (avatar) {

      avatarHTML = `
        <img
          src="${escapeHTML(avatar)}"
          alt="${escapeHTML(name)}"
          onerror="
            this.style.display='none';
            this.parentElement.textContent='${escapeHTML(
              initials(name)
            )}';
          "
        >
      `;

    } else {

      avatarHTML =
        escapeHTML(
          initials(name)
        );

    }


    const verified =
      profile.is_verified === true &&
      window.App &&
      typeof App.verifyBadgeHTML ===
        "function"
        ? App.verifyBadgeHTML()
        : "";


    return `

      <article
        class="dashboard-post"
        data-post-id="${escapeHTML(post.id)}"
      >

        <div class="dashboard-post-author">

          <div class="dashboard-post-avatar">
            ${avatarHTML}
          </div>


          <div class="dashboard-post-author-info">

            <h3 class="dashboard-post-author-name">

              <a
                href="profile.html?id=${encodeURIComponent(
                  profile.id ||
                  post.author_id
                )}"
              >
                ${escapeHTML(name)}
              </a>

              ${verified}

            </h3>

            <p class="dashboard-post-headline">
              ${escapeHTML(headline)}
            </p>

          </div>


          <time
            class="dashboard-post-time"
            datetime="${escapeHTML(
              post.created_at
            )}"
          >
            ${escapeHTML(
              formatTime(post.created_at)
            )}
          </time>

        </div>


        <div class="dashboard-post-body">
          ${escapeHTML(post.body)}
        </div>


        <div class="dashboard-post-footer">

          <button
            type="button"
            class="dashboard-post-action ${
              post.liked_by_me
                ? "liked"
                : ""
            }"
            data-like-post="${escapeHTML(
              post.id
            )}"
          >

            <svg
              viewBox="0 0 24 24"
              fill="${
                post.liked_by_me
                  ? "currentColor"
                  : "none"
              }"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20.8 8.6A5.5 5.5 0 0012 5.2 5.5 5.5 0 003.2 8.6C3.2 13.3 12 19 12 19s8.8-5.7 8.8-10.4z"/>
            </svg>

            <span>
              ${post.like_count || 0}
            </span>

            Like

          </button>


          <button
            type="button"
            class="dashboard-post-action"
            data-comment-post="${escapeHTML(
              post.id
            )}"
          >

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 11.5a8.4 8.4 0 01-9 8.3 8.6 8.6 0 01-4-.9L3 20l1.3-4.2A8.1 8.1 0 013 11.5a8.4 8.4 0 018.7-8.3 8.4 8.4 0 019.3 8.3z"/>
            </svg>

            <span>
              ${post.comment_count || 0}
            </span>

            Comment

          </button>


          <a
            href="posts.html?id=${encodeURIComponent(
              post.id
            )}"
            class="dashboard-post-action"
          >

            View post

          </a>

        </div>

      </article>

    `;

  }


  /* ==========================================================================
     LIKE
     ========================================================================== */

  async function toggleLike(
    postId,
    button
  ) {

    if (
      !currentUser?.id ||
      !postId ||
      !button
    ) {

      alert(
        "Please login first."
      );

      return;

    }


    const post =
      currentPosts.find(
        item =>
          item.id ===
          postId
      );

    if (!post) {
      return;
    }


    button.disabled = true;


    try {

      if (post.liked_by_me) {

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
            currentUser.id
          );

        if (error) {
          throw error;
        }

        post.liked_by_me =
          false;

        post.like_count =
          Math.max(
            0,
            (post.like_count || 0) - 1
          );

      } else {

        const {
          error
        } = await sb
          .from("post_likes")
          .insert({
            post_id:
              postId,

            user_id:
              currentUser.id
          });

        if (error) {
          throw error;
        }

        post.liked_by_me =
          true;

        post.like_count =
          (post.like_count || 0) + 1;

      }

      renderFeed();

    } catch (error) {

      console.error(
        "Like error:",
        error
      );

      alert(
        error?.message ||
        "Unable to update like."
      );

    } finally {

      button.disabled = false;

    }

  }


  /* ==========================================================================
     COMMENTS
     ========================================================================== */

  async function openComments(
    postId
  ) {

    if (!postId) {
      return;
    }

    window.location.href =
      `posts.html?id=${encodeURIComponent(
        postId
      )}`;

  }


  /* ==========================================================================
     FEED EVENTS
     ========================================================================== */

  document.addEventListener(
    "click",
    async event => {

      const likeButton =
        event.target.closest(
          "[data-like-post]"
        );

      if (likeButton) {

        await toggleLike(
          likeButton.dataset.likePost,
          likeButton
        );

        return;

      }


      const commentButton =
        event.target.closest(
          "[data-comment-post]"
        );

      if (commentButton) {

        await openComments(
          commentButton.dataset.commentPost
        );

      }

    }
  );


  /* ==========================================================================
     RECOMMENDATION SCORE
     ========================================================================== */

  function accountTypeScore(
    myType,
    theirType
  ) {

    const me =
      normalize(myType);

    const them =
      normalize(theirType);

    if (!me || !them) {
      return 0;
    }

    if (me === them) {
      return 8;
    }

    const compatible = {

      investor: [
        "professional",
        "advisor",
        "founder"
      ],

      professional: [
        "investor",
        "advisor",
        "founder"
      ],

      advisor: [
        "investor",
        "professional",
        "founder"
      ],

      founder: [
        "investor",
        "professional",
        "advisor"
      ],

      student: [
        "professional",
        "advisor",
        "founder"
      ]

    };

    if (
      compatible[me]?.includes(them)
    ) {

      return 20;

    }

    return 3;

  }


  function recommendationScore(
    me,
    person
  ) {

    if (!me || !person) {
      return 0;
    }

    let score = 0;


    if (
      normalize(me.location) &&
      normalize(me.location) ===
        normalize(person.location)
    ) {

      score += 30;

    }


    if (
      normalize(me.industry) &&
      normalize(me.industry) ===
        normalize(person.industry)
    ) {

      score += 30;

    }


    const expertise =
      intersection(
        arrayValue(me.expertise),
        arrayValue(person.expertise)
      );

    score +=
      expertise.length * 10;


    const interests =
      intersection(
        arrayValue(me.interests),
        arrayValue(person.interests)
      );

    score +=
      interests.length * 8;


    score +=
      accountTypeScore(
        me.account_type,
        person.account_type
      );


    if (
      person.is_verified === true
    ) {

      score += 5;

    }

    return score;

  }


  /* ==========================================================================
     RECOMMENDATIONS
     ========================================================================== */

  async function loadRecommendations(
    searchTerm = ""
  ) {

    if (!peopleContainer) {
      return;
    }

    peopleContainer.innerHTML = `
      <div
        class="dashboard-feed-empty"
        style="grid-column:1/-1;"
      >
        <h3>Loading recommendations...</h3>
        <p>Finding relevant professionals.</p>
      </div>
    `;


    try {

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
          location,
          industry,
          expertise,
          interests,
          company_name,
          avatar_url,
          is_verified,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: false
          }
        );

      if (error) {
        throw error;
      }


      let people =
        data || [];


      if (currentUser?.id) {

        people =
          people.filter(
            person =>
              person.id !==
              currentUser.id
          );

      }


      /* ----------------------------------------------------------------------
         EXCLUDE CONNECTED / PENDING
      ---------------------------------------------------------------------- */

      if (currentUser?.id) {

        const {
          data: rows,
          error: connectionError
        } = await sb
          .from("connections")
          .select(`
            requester_id,
            addressee_id,
            status
          `)
          .or(
            `requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`
          );

        if (!connectionError) {

          const excluded =
            new Set();

          (rows || [])
            .forEach(connection => {

              const other =
                connection.requester_id ===
                currentUser.id
                  ? connection.addressee_id
                  : connection.requester_id;

              if (
                [
                  "accepted",
                  "pending"
                ].includes(
                  normalize(
                    connection.status
                  )
                )
              ) {

                excluded.add(
                  other
                );

              }

            });

          people =
            people.filter(
              person =>
                !excluded.has(
                  person.id
                )
            );

        }

      }


      /* ----------------------------------------------------------------------
         SEARCH
      ---------------------------------------------------------------------- */

      const query =
        normalize(searchTerm);

      if (query) {

        people =
          people.filter(
            person => {

              const searchable = [

                person.full_name,
                person.username,
                person.headline,
                person.company_name,
                person.location,
                person.industry,

                ...arrayValue(
                  person.expertise
                ),

                ...arrayValue(
                  person.interests
                )

              ]
                .filter(Boolean)
                .join(" ");

              return normalize(
                searchable
              ).includes(query);

            }
          );

      }


      /* ----------------------------------------------------------------------
         SCORE
      ---------------------------------------------------------------------- */

      people =
        people
          .map(person => ({

            ...person,

            score:
              recommendationScore(
                currentUser,
                person
              ),

            createdTimestamp:
              new Date(
                person.created_at || 0
              ).getTime()

          }))
          .sort((a, b) => {

            if (
              b.score !==
              a.score
            ) {

              return (
                b.score -
                a.score
              );

            }

            return (
              b.createdTimestamp -
              a.createdTimestamp
            );

          })
          .slice(0, 6);


      if (!people.length) {

        peopleContainer.innerHTML = `
          <div
            class="dashboard-feed-empty"
            style="grid-column:1/-1;"
          >

            <h3>
              ${
                query
                  ? "No people found"
                  : "No recommendations yet"
              }
            </h3>

            <p>
              ${
                query
                  ? "Try another search."
                  : "More professionals will appear as your network grows."
              }
            </p>

          </div>
        `;

        return;

      }


      peopleContainer.innerHTML =
        people
          .map(personCard)
          .join("");


    } catch (error) {

      console.error(
        "Recommendations error:",
        error
      );

      peopleContainer.innerHTML = `
        <div
          class="dashboard-feed-error"
          style="grid-column:1/-1;"
        >

          <h3>
            Recommendations unavailable
          </h3>

          <p>
            ${escapeHTML(
              error?.message ||
              "Unable to load recommendations."
            )}
          </p>

        </div>
      `;

    }

  }


  /* ==========================================================================
     PERSON CARD
     ========================================================================== */

  function personCard(person) {

    const name =
      person.full_name ||
      "IGCA Member";

    const title =
      person.headline ||
      person.account_type ||
      "Professional";

    const company =
      person.company_name ||
      "";

    const location =
      person.location ||
      "";

    const expertise =
      arrayValue(
        person.expertise
      ).slice(0, 2);

    let avatarHTML;

    if (person.avatar_url) {

      avatarHTML = `
        <img
          src="${escapeHTML(
            person.avatar_url
          )}"
          alt="${escapeHTML(name)}"
          class="avatar"
          style="
            object-fit:cover;
            display:block;
          "
          onerror="
            this.style.display='none';
            this.nextElementSibling.style.display='flex';
          "
        >

        <div
          class="avatar"
          style="
            display:none;
            align-items:center;
            justify-content:center;
          "
        >
          ${escapeHTML(
            initials(name)
          )}
        </div>
      `;

    } else {

      avatarHTML = `
        <div class="avatar">
          ${escapeHTML(
            initials(name)
          )}
        </div>
      `;

    }


    return `
      <article class="profile-card">

        <div class="profile-card-top">

          ${avatarHTML}

          <div
            style="
              min-width:0;
              flex:1;
            "
          >

            <div class="profile-name-row">

              <h3>
                ${escapeHTML(name)}
              </h3>

              ${
                person.is_verified &&
                window.App &&
                typeof App.verifyBadgeHTML ===
                  "function"
                  ? App.verifyBadgeHTML()
                  : ""
              }

            </div>

            <p class="title">
              ${escapeHTML(title)}
            </p>

          </div>

        </div>


        ${
          company
            ? `
              <div class="meta">
                ${escapeHTML(company)}
              </div>
            `
            : ""
        }


        ${
          location
            ? `
              <div class="meta">
                ${escapeHTML(location)}
              </div>
            `
            : ""
        }


        ${
          expertise.length
            ? `
              <div class="chip-row">

                ${expertise
                  .map(
                    item =>
                      `
                        <span class="chip">
                          ${escapeHTML(item)}
                        </span>
                      `
                  )
                  .join("")}

              </div>
            `
            : ""
        }


        <div class="profile-card-actions">

          <a
            href="profile.html?id=${encodeURIComponent(
              person.id
            )}"
            class="btn btn-outline btn-sm"
          >
            View Profile
          </a>

          <button
            type="button"
            class="btn btn-primary btn-sm"
            data-connect-id="${escapeHTML(
              person.id
            )}"
          >
            Connect
          </button>

        </div>

      </article>
    `;

  }


  /* ==========================================================================
     CONNECTION
     ========================================================================== */

  document.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          "[data-connect-id]"
        );

      if (!button) {
        return;
      }

      const personId =
        button.dataset.connectId;

      if (
        !personId ||
        !currentUser?.id
      ) {

        alert(
          "Please login first."
        );

        return;

      }


      try {

        button.disabled = true;

        button.textContent =
          "Sending...";


        if (
          window.IGCA_API &&
          typeof IGCA_API.sendConnection ===
            "function"
        ) {

          await IGCA_API.sendConnection(
            personId
          );

        } else {

          const {
            error
          } = await sb
            .from("connections")
            .insert({

              requester_id:
                currentUser.id,

              addressee_id:
                personId,

              status:
                "pending"

            });

          if (error) {
            throw error;
          }

        }


        button.textContent =
          "Requested";

        button.classList.remove(
          "btn-primary"
        );

        button.classList.add(
          "btn-outline"
        );


        await loadStats();

        await loadRecommendations(
          searchInput
            ? searchInput.value.trim()
            : ""
        );

      } catch (error) {

        console.error(
          "Connection error:",
          error
        );

        button.disabled =
          false;

        button.textContent =
          "Connect";

        alert(
          error?.message ||
          "Unable to send connection request."
        );

      }

    }
  );


  /* ==========================================================================
     SEARCH
     ========================================================================== */

  async function performSearch() {

    const query =
      searchInput
        ? searchInput.value.trim()
        : "";

    await loadRecommendations(
      query
    );

  }


  if (searchButton) {

    searchButton.addEventListener(
      "click",
      performSearch
    );

  }


  if (searchInput) {

    searchInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          performSearch();

        }

      }
    );


    searchInput.addEventListener(
      "input",
      () => {

        clearTimeout(
          searchTimer
        );

        searchTimer =
          setTimeout(
            performSearch,
            350
          );

      }
    );

  }


  /* ==========================================================================
     OPPORTUNITIES
     ========================================================================== */

  async function loadOpportunities() {

    if (!opportunitiesContainer) {
      return;
    }

    try {

      const {
        data,
        error
      } = await sb
        .from("opportunities")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(4);

      if (error) {
        throw error;
      }

      const rows =
        data || [];

      if (!rows.length) {

        opportunitiesContainer.innerHTML = `
          <div
            class="dashboard-feed-empty"
            style="grid-column:1/-1;"
          >
            <h3>No opportunities yet</h3>
            <p>
              New opportunities will appear here.
            </p>
          </div>
        `;

        return;

      }


      opportunitiesContainer.innerHTML =
        rows
          .map(
            item => `

              <article
                class="dashboard-opportunity-card"
              >

                <span class="section-eyebrow">
                  OPPORTUNITY
                </span>

                <h3>
                  ${escapeHTML(
                    item.title ||
                    item.name ||
                    "Opportunity"
                  )}
                </h3>

                <p>
                  ${escapeHTML(
                    item.description ||
                    item.summary ||
                    "Explore this opportunity."
                  )}
                </p>

              </article>

            `
          )
          .join("");

    } catch (error) {

      console.error(
        "Opportunities error:",
        error
      );

      opportunitiesContainer.innerHTML = `
        <div
          class="dashboard-feed-empty"
          style="grid-column:1/-1;"
        >
          <h3>
            Opportunities unavailable
          </h3>

          <p>
            ${escapeHTML(
              error?.message ||
              "Unable to load opportunities."
            )}
          </p>
        </div>
      `;

    }

  }


  /* ==========================================================================
     INSIGHTS
     ========================================================================== */

  async function loadInsights() {

    if (!insightsContainer) {
      return;
    }

    try {

      const {
        data,
        error
      } = await sb
        .from("insights")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(3);

      if (error) {
        throw error;
      }

      const rows =
        data || [];

      if (!rows.length) {

        insightsContainer.innerHTML = `
          <div
            class="dashboard-feed-empty"
            style="grid-column:1/-1;"
          >
            <h3>No insights yet</h3>
            <p>
              Professional insights will appear here.
            </p>
          </div>
        `;

        return;

      }


      insightsContainer.innerHTML =
        rows
          .map(
            item => `

              <article
                class="dashboard-insight-card"
              >

                <span class="section-eyebrow">
                  INSIGHT
                </span>

                <h3>
                  ${escapeHTML(
                    item.title ||
                    item.name ||
                    "Professional Insight"
                  )}
                </h3>

                <p>
                  ${escapeHTML(
                    item.description ||
                    item.summary ||
                    item.body ||
                    "Explore this insight."
                  )}
                </p>

              </article>

            `
          )
          .join("");

    } catch (error) {

      console.error(
        "Insights error:",
        error
      );

      insightsContainer.innerHTML = `
        <div
          class="dashboard-feed-empty"
          style="grid-column:1/-1;"
        >
          <h3>
            Insights unavailable
          </h3>

          <p>
            ${escapeHTML(
              error?.message ||
              "Unable to load insights."
            )}
          </p>
        </div>
      `;

    }

  }


  /* ==========================================================================
     LEARN
     ========================================================================== */

  async function loadLearn() {

    if (!learnContainer) {
      return;
    }

    try {

      const {
        data,
        error
      } = await sb
        .from("learn_videos")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(2);

      if (error) {
        throw error;
      }

      const rows =
        data || [];

      if (!rows.length) {

        learnContainer.innerHTML = `
          <div
            class="dashboard-feed-empty"
            style="grid-column:1/-1;"
          >
            <h3>No learning resources yet</h3>
            <p>
              Learning content will appear here.
            </p>
          </div>
        `;

        return;

      }


      learnContainer.innerHTML =
        rows
          .map(
            item => `

              <article
                class="dashboard-learn-card"
              >

                <span class="section-eyebrow">
                  LEARN & GROW
                </span>

                <h3>
                  ${escapeHTML(
                    item.title ||
                    item.name ||
                    "Learning Resource"
                  )}
                </h3>

                <p>
                  ${escapeHTML(
                    item.description ||
                    item.summary ||
                    "Explore this learning resource."
                  )}
                </p>

              </article>

            `
          )
          .join("");

    } catch (error) {

      console.error(
        "Learn error:",
        error
      );

      learnContainer.innerHTML = `
        <div
          class="dashboard-feed-empty"
          style="grid-column:1/-1;"
        >
          <h3>
            Learning unavailable
          </h3>

          <p>
            ${escapeHTML(
              error?.message ||
              "Unable to load learning resources."
            )}
          </p>
        </div>
      `;

    }

  }


  /* ==========================================================================
     TRENDING
     ========================================================================== */

  async function loadTrending() {

    if (!trendingContainer) {
      return;
    }

    /*
      IMPORTANT:
      No fake #PrivateEquity / #Investment data here.

      Trending will be supplied by the server-side
      trending endpoint / Edge Function.

      If the endpoint is not configured yet,
      we show a clean unavailable state instead
      of displaying fake topics.
    */

    trendingContainer.innerHTML = `
      <div class="dashboard-trending-loading">
        Live topics are being prepared.
      </div>
    `;


    try {

      if (
        window.IGCA_API &&
        typeof IGCA_API.getTrendingTopics ===
          "function"
      ) {

        const topics =
          await IGCA_API.getTrendingTopics();

        if (
          Array.isArray(topics) &&
          topics.length
        ) {

          trendingContainer.innerHTML =
            topics
              .slice(0, 5)
              .map(
                topic => `

                  <div>

                    <div class="dashboard-trending-topic">

                      <strong>
                        ${escapeHTML(
                          topic.name ||
                          topic.topic ||
                          topic.title ||
                          ""
                        )}
                      </strong>

                      ${
                        topic.count
                          ? `
                            <small>
                              ${escapeHTML(
                                topic.count
                              )}
                            </small>
                          `
                          : ""
                      }

                    </div>

                  </div>

                `
              )
              .join("");

          return;

        }

      }


      trendingContainer.innerHTML = `
        <div class="dashboard-trending-empty">
          Live trending data is not configured yet.
        </div>
      `;

    } catch (error) {

      console.error(
        "Trending error:",
        error
      );

      trendingContainer.innerHTML = `
        <div class="dashboard-trending-empty">
          Live topics are temporarily unavailable.
        </div>
      `;

    }

  }


  /* ==========================================================================
     REALTIME
     ========================================================================== */

  function setupRealtime() {

    try {

      if (realtimeChannel) {

        try {

          sb.removeChannel(
            realtimeChannel
          );

        } catch (_) {}

      }


      realtimeChannel =
        sb.channel(
          "igca-dashboard-live-v2"
        );


      /* ----------------------------------------------------------------------
         POSTS
      ---------------------------------------------------------------------- */

      realtimeChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts"
        },
        async payload => {

          console.log(
            "IGCA realtime post:",
            payload.eventType
          );

          await loadFeed();

        }
      );


      /* ----------------------------------------------------------------------
         LIKES
      ---------------------------------------------------------------------- */

      realtimeChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_likes"
        },
        async () => {

          await loadFeed();

        }
      );


      /* ----------------------------------------------------------------------
         COMMENTS
      ---------------------------------------------------------------------- */

      realtimeChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments"
        },
        async () => {

          await loadFeed();

        }
      );


      /* ----------------------------------------------------------------------
         CONNECTIONS
      ---------------------------------------------------------------------- */

      realtimeChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connections"
        },
        async () => {

          await loadStats();

          await loadRecommendations(
            searchInput
              ? searchInput.value.trim()
              : ""
          );

        }
      );


      /* ----------------------------------------------------------------------
         MESSAGES
      ---------------------------------------------------------------------- */

      realtimeChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages"
        },
        async () => {

          await loadStats();

        }
      );


      /* ----------------------------------------------------------------------
         APPOINTMENTS
      ---------------------------------------------------------------------- */

      realtimeChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments"
        },
        async () => {

          await loadStats();

        }
      );


      /* ----------------------------------------------------------------------
         PROFILES
      ---------------------------------------------------------------------- */

      realtimeChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles"
        },
        async () => {

          await loadCurrentUser();

          await loadFeed();

          await loadRecommendations(
            searchInput
              ? searchInput.value.trim()
              : ""
          );

        }
      );


      realtimeChannel.subscribe(
        status => {

          console.log(
            "IGCA Dashboard Realtime:",
            status
          );

        }
      );

    } catch (error) {

      console.error(
        "Realtime setup error:",
        error
      );

    }

  }


  /* ==========================================================================
     INITIAL LOAD
     ========================================================================== */

  await loadCurrentUser();


  await Promise.all([
    loadStats(),
    loadFeed(),
    loadRecommendations(),
    loadOpportunities(),
    loadInsights(),
    loadLearn(),
    loadTrending()
  ]);


  setupRealtime();


  /* ==========================================================================
     DONE
     ========================================================================== */

  console.log(
    "IGCA Dashboard loaded — LIVE Supabase"
  );

});
