/* ==========================================================================
   IGCA — POSTS
   FINAL POSTS ENGINE
   ========================================================================== */

(function () {

  "use strict";

  let currentUser = null;
  let postsData = [];
  let editingPostId = null;
  let activeCommentPostId = null;
  let realtimeChannel = null;
  let initialized = false;


  /* ========================================================================
     INIT
  ======================================================================== */

  document.addEventListener("DOMContentLoaded", init);


  async function init() {

    if (initialized) return;
    initialized = true;

    try {

      ensureCreatePostUI();

      currentUser = await IGCA_API.user();

      if (!currentUser) {
        showError("Please login to view posts.");
        return;
      }

      await loadCurrentUser();
      setupEvents();
      updateCharCount();
      await loadPosts();
      setupRealtime();

    } catch (error) {

      console.error("IGCA Posts initialization error:", error);

      showError(
        error?.message ||
        "Unable to initialize posts."
      );
    }
  }


  /* ========================================================================
     DOM HELPERS
  ======================================================================== */

  function get(id) {
    return document.getElementById(id);
  }


  /*
   * If the HTML does not contain New Post button,
   * create it automatically.
   */

  function ensureCreatePostUI() {

    let createCard = get("createPostCard");

    const header = document.querySelector(".posts-header");

    /*
     * CREATE BUTTON
     */

    if (!get("newPostBtn") && header) {

      const button = document.createElement("button");

      button.type = "button";
      button.id = "newPostBtn";
      button.className = "primary-btn";
      button.textContent = "+ New Post";

      header.appendChild(button);
    }


    /*
     * CREATE POST CARD
     *
     * If complete create card doesn't exist,
     * generate one automatically.
     */

    if (!createCard) {

      const page =
        document.querySelector(".posts-page") ||
        document.body;

      createCard =
        document.createElement("section");

      createCard.id = "createPostCard";
      createCard.className = "create-post-card";

      createCard.innerHTML = `

        <div class="create-post-header">

          <div
            class="avatar"
            id="currentUserAvatar"
          >
            U
          </div>

          <div>
            <strong id="currentUserName">
              User
            </strong>

            <span>
              Share something with IGCA
            </span>
          </div>

        </div>


        <textarea
          id="postBody"
          maxlength="5000"
          placeholder="What's on your mind?"
        ></textarea>


        <div class="create-post-footer">

          <span id="postCharCount">
            0 / 5000
          </span>

          <div class="create-actions">

            <button
              type="button"
              class="secondary-btn"
              id="cancelPostBtn"
            >
              Cancel
            </button>

            <button
              type="button"
              class="primary-btn"
              id="publishPostBtn"
            >
              Publish Post
            </button>

          </div>

        </div>
      `;

      /*
       * Put create card before feed.
       */

      const feed =
        document.querySelector(".feed-section") ||
        document.querySelector(".posts-feed");

      if (feed && feed.parentNode) {
        feed.parentNode.insertBefore(
          createCard,
          feed
        );
      } else {
        page.appendChild(createCard);
      }
    }
  }


  /* ========================================================================
     CURRENT USER
  ======================================================================== */

  async function loadCurrentUser() {

    const nameElement =
      get("currentUserName");

    const avatarElement =
      get("currentUserAvatar");

    try {

      const profile =
        await IGCA_API.profile();

      if (!profile) return;

      const name =
        profile.full_name ||
        profile.username ||
        "User";


      if (nameElement) {
        nameElement.textContent = name;
      }


      if (avatarElement) {

        if (profile.avatar_url) {

          avatarElement.innerHTML = `
            <img
              src="${escapeAttribute(profile.avatar_url)}"
              alt=""
            >
          `;

        } else {

          avatarElement.textContent =
            getInitials(name);
        }
      }

    } catch (error) {

      console.error(
        "Load current profile error:",
        error
      );
    }
  }


  /* ========================================================================
     LOAD POSTS
  ======================================================================== */

  async function loadPosts() {

    const loading =
      get("postsLoading");

    const empty =
      get("postsEmpty");

    if (loading) {
      loading.classList.remove("hidden");
    }

    hideError();

    if (empty) {
      empty.classList.add("hidden");
    }


    try {

      const result =
        await IGCA_API.posts();

      postsData =
        Array.isArray(result)
          ? result
          : [];

      await preparePostMeta();

      renderPosts();

    } catch (error) {

      console.error(
        "Load posts error:",
        error
      );

      showError(
        error?.message ||
        "Unable to load posts."
      );

    } finally {

      if (loading) {
        loading.classList.add("hidden");
      }
    }
  }


  /* ========================================================================
     POST META
  ======================================================================== */

  async function preparePostMeta() {

    await Promise.all(
      postsData.map(
        async post => {

          try {

            post.likeCount =
              await IGCA_API.postLikeCount(
                post.id
              );

          } catch {

            post.likeCount = 0;
          }


          try {

            post.liked =
              await IGCA_API.hasLikedPost(
                post.id
              );

          } catch {

            post.liked = false;
          }
        }
      )
    );
  }


  /* ========================================================================
     RENDER
  ======================================================================== */

  function renderPosts() {

    const feed =
      get("postsFeed");

    const empty =
      get("postsEmpty");

    if (!feed) {
      console.error(
        "IGCA Posts: #postsFeed not found."
      );
      return;
    }


    feed.innerHTML = "";


    if (!postsData.length) {

      if (empty) {
        empty.classList.remove("hidden");
      }

      return;
    }


    if (empty) {
      empty.classList.add("hidden");
    }


    postsData.forEach(
      post => {

        feed.appendChild(
          createPostElement(post)
        );
      }
    );
  }


  /* ========================================================================
     CREATE POST ELEMENT
  ======================================================================== */

  function createPostElement(post) {

    const article =
      document.createElement("article");

    article.className =
      "post-card";

    article.dataset.postId =
      String(post.id);


    const author =
      post.author || {};


    const isOwner =
      currentUser &&
      String(post.author_id) ===
      String(currentUser.id);


    const authorName =
      author.full_name ||
      author.username ||
      "Unknown User";


    const avatarHTML =
      author.avatar_url

        ? `
          <div class="avatar">
            <img
              src="${escapeAttribute(
                author.avatar_url
              )}"
              alt=""
            >
          </div>
        `

        : `
          <div class="avatar">
            ${escapeHTML(
              getInitials(authorName)
            )}
          </div>
        `;


    const menuHTML =
      isOwner

        ? `
          <div class="post-menu">

            <button
              type="button"
              class="post-menu-btn"
              data-action="menu"
              aria-label="Post menu"
            >
              ⋯
            </button>

            <div
              class="post-menu-dropdown hidden"
              data-menu
            >

              <button
                type="button"
                data-action="edit"
              >
                Edit
              </button>

              <button
                type="button"
                class="delete-btn"
                data-action="delete"
              >
                Delete
              </button>

            </div>

          </div>
        `
        : "";


    const liked =
      Boolean(post.liked);


    article.innerHTML = `

      <div class="post-header">

        <div class="post-author">

          ${avatarHTML}

          <div class="post-author-info">

            <strong>
              ${escapeHTML(authorName)}
            </strong>

            <span>

              ${
                author.username
                  ? `@${escapeHTML(
                      author.username
                    )} · `
                  : ""
              }

              ${escapeHTML(
                formatDate(post.created_at)
              )}

            </span>

          </div>

        </div>

        ${menuHTML}

      </div>


      <div class="post-body">
        ${escapeHTML(post.body)}
      </div>


      <div class="post-actions">

        <button
          type="button"
          class="post-action ${
            liked ? "liked" : ""
          }"
          data-action="like"
        >

          ${liked ? "♥ Liked" : "♡ Like"}

          <span>
            (${Number(post.likeCount) || 0})
          </span>

        </button>


        <button
          type="button"
          class="post-action"
          data-action="comments"
        >
          💬 Comments
        </button>

      </div>
    `;


    return article;
  }


  /* ========================================================================
     EVENTS
  ======================================================================== */

  function setupEvents() {

    get("newPostBtn")
      ?.addEventListener(
        "click",
        focusCreatePost
      );


    get("emptyCreateBtn")
      ?.addEventListener(
        "click",
        focusCreatePost
      );


    get("cancelPostBtn")
      ?.addEventListener(
        "click",
        clearCreatePost
      );


    get("publishPostBtn")
      ?.addEventListener(
        "click",
        publishPost
      );


    get("refreshPostsBtn")
      ?.addEventListener(
        "click",
        loadPosts
      );


    get("retryPostsBtn")
      ?.addEventListener(
        "click",
        loadPosts
      );


    get("postBody")
      ?.addEventListener(
        "input",
        updateCharCount
      );


    get("postsFeed")
      ?.addEventListener(
        "click",
        handlePostAction
      );


    get("closeEditModalBtn")
      ?.addEventListener(
        "click",
        closeEditModal
      );


    get("cancelEditBtn")
      ?.addEventListener(
        "click",
        closeEditModal
      );


    get("saveEditBtn")
      ?.addEventListener(
        "click",
        saveEditedPost
      );


    get("closeCommentsBtn")
      ?.addEventListener(
        "click",
        closeCommentsModal
      );


    get("sendCommentBtn")
      ?.addEventListener(
        "click",
        submitComment
      );


    get("commentInput")
      ?.addEventListener(
        "keydown",
        event => {

          if (event.key === "Enter") {

            event.preventDefault();

            submitComment();
          }
        }
      );


    /*
     * Close menus when clicking outside.
     */

    document.addEventListener(
      "click",
      event => {

        if (
          !event.target.closest(".post-menu")
        ) {

          document
            .querySelectorAll("[data-menu]")
            .forEach(
              menu =>
                menu.classList.add("hidden")
            );
        }
      }
    );


    /*
     * Escape closes modals.
     */

    document.addEventListener(
      "keydown",
      event => {

        if (event.key !== "Escape") {
          return;
        }

        closeEditModal();
        closeCommentsModal();
      }
    );
  }


  /* ========================================================================
     CREATE POST
  ======================================================================== */

  async function publishPost() {

    const textarea =
      get("postBody");

    const button =
      get("publishPostBtn");


    if (!textarea || !button) {
      console.error(
        "Create post elements missing."
      );
      return;
    }


    const text =
      textarea.value.trim();


    if (!text) {

      alert(
        "Please write something first."
      );

      textarea.focus();

      return;
    }


    if (text.length > 5000) {

      alert(
        "Post cannot exceed 5000 characters."
      );

      return;
    }


    setButtonLoading(
      button,
      true,
      "Publishing..."
    );


    try {

      const newPost =
        await IGCA_API.createPost(text);


      /*
       * Get latest profile for author.
       */

      let profile = null;

      try {
        profile =
          await IGCA_API.profile();
      } catch {}


      newPost.author =
        profile || {
          id: currentUser.id
        };


      newPost.likeCount = 0;
      newPost.liked = false;


      /*
       * Avoid duplicate realtime insert.
       */

      postsData =
        postsData.filter(
          post =>
            String(post.id) !==
            String(newPost.id)
        );


      postsData.unshift(newPost);

      clearCreatePost();

      renderPosts();


      /*
       * Refresh from database after creation.
       * This guarantees correct author/data.
       */

      setTimeout(
        () => loadPosts(),
        300
      );


    } catch (error) {

      console.error(
        "Create post error:",
        error
      );

      alert(
        error?.message ||
        "Unable to create post."
      );

    } finally {

      setButtonLoading(
        button,
        false,
        "Publish Post"
      );
    }
  }


  /* ========================================================================
     POST ACTIONS
  ======================================================================== */

  async function handlePostAction(event) {

    const button =
      event.target.closest(
        "[data-action]"
      );


    if (!button) {
      return;
    }


    const card =
      button.closest(".post-card");


    if (!card) {
      return;
    }


    const postId =
      card.dataset.postId;


    const post =
      postsData.find(
        item =>
          String(item.id) ===
          String(postId)
      );


    if (!post) {
      return;
    }


    const action =
      button.dataset.action;


    if (action === "like") {

      await toggleLike(
        post,
        button
      );

      return;
    }


    if (action === "comments") {

      await openComments(post.id);

      return;
    }


    if (action === "menu") {

      const menu =
        card.querySelector("[data-menu]");

      menu?.classList.toggle("hidden");

      return;
    }


    if (action === "edit") {

      openEditModal(post);

      return;
    }


    if (action === "delete") {

      await deletePost(post);
    }
  }


  /* ========================================================================
     LIKE
  ======================================================================== */

  async function toggleLike(
    post,
    button
  ) {

    button.disabled = true;


    try {

      if (post.liked) {

        await IGCA_API.unlikePost(
          post.id
        );

        post.liked = false;

        post.likeCount =
          Math.max(
            0,
            Number(post.likeCount || 0) - 1
          );

      } else {

        await IGCA_API.likePost(
          post.id
        );

        post.liked = true;

        post.likeCount =
          Number(post.likeCount || 0) + 1;
      }


      renderPosts();


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


  /* ========================================================================
     EDIT
  ======================================================================== */

  function openEditModal(post) {

    const modal =
      get("editPostModal");

    const body =
      get("editPostBody");


    if (!modal || !body) {
      alert(
        "Edit post UI is missing."
      );
      return;
    }


    editingPostId =
      post.id;

    body.value =
      post.body || "";


    modal.classList.remove("hidden");

    setTimeout(
      () => body.focus(),
      50
    );
  }


  function closeEditModal() {

    const modal =
      get("editPostModal");

    const body =
      get("editPostBody");


    editingPostId = null;


    if (body) {
      body.value = "";
    }


    modal?.classList.add("hidden");
  }


  async function saveEditedPost() {

    if (!editingPostId) {
      return;
    }


    const body =
      get("editPostBody");

    const button =
      get("saveEditBtn");


    const text =
      body?.value.trim();


    if (!text) {

      alert(
        "Post cannot be empty."
      );

      return;
    }


    setButtonLoading(
      button,
      true,
      "Saving..."
    );


    try {

      const updated =
        await IGCA_API.updatePost(
          editingPostId,
          text
        );


      const index =
        postsData.findIndex(
          post =>
            String(post.id) ===
            String(editingPostId)
        );


      if (index !== -1) {

        postsData[index] = {
          ...postsData[index],
          ...(updated || {}),
          body: text
        };
      }


      closeEditModal();

      renderPosts();


    } catch (error) {

      console.error(
        "Edit post error:",
        error
      );

      alert(
        error?.message ||
        "Unable to update post."
      );

    } finally {

      setButtonLoading(
        button,
        false,
        "Save Changes"
      );
    }
  }


  /* ========================================================================
     DELETE
  ======================================================================== */

  async function deletePost(post) {

    const confirmed =
      confirm(
        "Are you sure you want to delete this post?"
      );


    if (!confirmed) {
      return;
    }


    try {

      await IGCA_API.deletePost(
        post.id
      );


      postsData =
        postsData.filter(
          item =>
            String(item.id) !==
            String(post.id)
        );


      renderPosts();


    } catch (error) {

      console.error(
        "Delete post error:",
        error
      );

      alert(
        error?.message ||
        "Unable to delete post."
      );
    }
  }


  /* ========================================================================
     COMMENTS
  ======================================================================== */

  async function openComments(postId) {

    const modal =
      get("commentsModal");

    const list =
      get("commentsList");


    if (!modal || !list) {

      alert(
        "Comments UI is missing."
      );

      return;
    }


    activeCommentPostId =
      postId;


    modal.classList.remove("hidden");


    list.innerHTML = `
      <div class="state-box">
        Loading comments...
      </div>
    `;


    try {

      await loadComments(postId);

    } catch (error) {

      console.error(
        "Comments error:",
        error
      );

      list.innerHTML = `
        <div class="state-box">
          Unable to load comments.
        </div>
      `;
    }
  }


  async function loadComments(postId) {

    const list =
      get("commentsList");

    const count =
      get("commentsCount");


    const comments =
      await IGCA_API.comments(postId);


    const safeComments =
      Array.isArray(comments)
        ? comments
        : [];


    if (count) {

      count.textContent =
        `${safeComments.length} ${
          safeComments.length === 1
            ? "comment"
            : "comments"
        }`;
    }


    list.innerHTML = "";


    if (!safeComments.length) {

      list.innerHTML = `
        <div class="state-box">
          No comments yet.
        </div>
      `;

      return;
    }


    safeComments.forEach(
      comment => {

        const author =
          comment.author || {};


        const name =
          author.full_name ||
          author.username ||
          "User";


        const item =
          document.createElement("div");


        item.className =
          "comment-item";


        item.innerHTML = `

          <div class="avatar">
            ${escapeHTML(
              getInitials(name)
            )}
          </div>

          <div class="comment-content">

            <strong>
              ${escapeHTML(name)}
            </strong>

            <p>
              ${escapeHTML(
                comment.body
              )}
            </p>

            <span>
              ${escapeHTML(
                formatDate(
                  comment.created_at
                )
              )}
            </span>

          </div>
        `;


        list.appendChild(item);
      }
    );
  }


  async function submitComment() {

    const input =
      get("commentInput");

    const button =
      get("sendCommentBtn");


    const text =
      input?.value.trim();


    if (!text) {
      return;
    }


    if (!activeCommentPostId) {
      return;
    }


    setButtonLoading(
      button,
      true,
      "Sending..."
    );


    try {

      await IGCA_API.createComment(
        activeCommentPostId,
        text
      );


      input.value = "";


      await loadComments(
        activeCommentPostId
      );


    } catch (error) {

      console.error(
        "Create comment error:",
        error
      );

      alert(
        error?.message ||
        "Unable to add comment."
      );

    } finally {

      setButtonLoading(
        button,
        false,
        "Send"
      );
    }
  }


  function closeCommentsModal() {

    const modal =
      get("commentsModal");

    const list =
      get("commentsList");


    activeCommentPostId = null;

    modal?.classList.add("hidden");

    if (list) {
      list.innerHTML = "";
    }
  }


  /* ========================================================================
     REALTIME
  ======================================================================== */

  function setupRealtime() {

    if (
      typeof IGCA_API.subscribePosts !==
      "function"
    ) {

      console.warn(
        "IGCA: subscribePosts() not available."
      );

      return;
    }


    try {

      realtimeChannel =
        IGCA_API.subscribePosts(
          async payload => {

            console.log(
              "IGCA Posts realtime:",
              payload
            );


            await loadPosts();
          }
        );

    } catch (error) {

      console.error(
        "Posts realtime error:",
        error
      );
    }
  }


  /* ========================================================================
     CREATE POST UI
  ======================================================================== */

  function focusCreatePost() {

    const card =
      get("createPostCard");

    const body =
      get("postBody");


    if (!card) {
      return;
    }


    card.classList.remove("hidden");


    card.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });


    setTimeout(
      () => body?.focus(),
      350
    );
  }


  function clearCreatePost() {

    const body =
      get("postBody");


    if (body) {
      body.value = "";
    }


    updateCharCount();
  }


  function updateCharCount() {

    const body =
      get("postBody");

    const counter =
      get("postCharCount");


    if (!body || !counter) {
      return;
    }


    counter.textContent =
      `${body.value.length} / 5000`;
  }


  /* ========================================================================
     LOADING / ERROR
  ======================================================================== */

  function setButtonLoading(
    button,
    loading,
    text
  ) {

    if (!button) {
      return;
    }


    if (loading) {

      if (!button.dataset.originalText) {

        button.dataset.originalText =
          button.textContent;
      }


      button.textContent =
        text;

      button.disabled = true;

    } else {

      button.textContent =
        text ||
        button.dataset.originalText ||
        "";

      button.disabled = false;
    }
  }


  function showError(message) {

    const errorBox =
      get("postsError");

    const errorText =
      get("postsErrorText");

    if (errorBox) {
      errorBox.classList.remove("hidden");
    }

    if (errorText) {
      errorText.textContent =
        message;
    }
  }


  function hideError() {

    get("postsError")
      ?.classList.add("hidden");
  }


  /* ========================================================================
     FORMAT
  ======================================================================== */

  function formatDate(value) {

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
      Math.max(
        0,
        now - date
      );


    const seconds =
      Math.floor(diff / 1000);


    if (seconds < 60) {
      return "Just now";
    }


    const minutes =
      Math.floor(seconds / 60);


    if (minutes < 60) {
      return `${minutes}m ago`;
    }


    const hours =
      Math.floor(minutes / 60);


    if (hours < 24) {
      return `${hours}h ago`;
    }


    const days =
      Math.floor(hours / 24);


    if (days < 7) {
      return `${days}d ago`;
    }


    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );
  }


  function getInitials(name) {

    const words =
      String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if (!words.length) {
      return "U";
    }


    if (words.length === 1) {

      return words[0]
        .charAt(0)
        .toUpperCase();
    }


    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  }


  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function escapeAttribute(value) {

    return escapeHTML(value);
  }
  /* ========================================================================
     CLEANUP
  ======================================================================== */

  window.addEventListener(
    "beforeunload",
    () => {

      try {

        if (
          realtimeChannel &&
          typeof IGCA_API.unsubscribePosts ===
          "function"
        ) {

          IGCA_API.unsubscribePosts(
            realtimeChannel
          );
        }

      } catch (error) {

        console.warn(
          "Posts realtime cleanup error:",
          error
        );
      }
    }
  );

})();
