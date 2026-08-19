/* ==========================================================================
   IGCA — Learn & Grow
   Dynamic YouTube Learning Content
   Supabase Edge Function + Inline YouTube Player
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
    App.mountShell("learn.html");
  }


  /* ==========================================================================
     DOM
     ========================================================================== */

  const industryEl =
    document.getElementById("learn-industry");

  const countryEl =
    document.getElementById("learn-country");

  const networkEl =
    document.getElementById("learn-network");

  const coursesEl =
    document.getElementById("learn-courses");

  const freeEl =
    document.getElementById("learn-free");


  const youtubeSections = [
    industryEl,
    countryEl,
    networkEl
  ];


  /* ==========================================================================
     HTML ESCAPE
     ========================================================================== */

  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  /* ==========================================================================
     LOADING STATE
     ========================================================================== */

  function showLoading(container) {

    if (!container) return;

    container.innerHTML = `
      <div class="learn-loading">

        <div class="learn-loading-spinner"></div>

        <span>
          Loading latest content...
        </span>

      </div>
    `;

  }


  youtubeSections.forEach(
    showLoading
  );


  /* ==========================================================================
     COMING SOON
     ========================================================================== */

  function renderComingSoon(
    container,
    icon,
    title,
    message
  ) {

    if (!container) return;

    container.innerHTML = `
      <div class="learn-coming-soon">

        <div class="learn-coming-soon-icon">
          ${icon}
        </div>

        <h3>
          ${escapeHTML(title)}
        </h3>

        <p>
          ${escapeHTML(message)}
        </p>

      </div>
    `;

  }


  /* ==========================================================================
     COURSES & CERTIFICATIONS
     ========================================================================== */

  renderComingSoon(

    coursesEl,

    "🎓",

    "Coming Soon",

    "Courses & Certifications will be available here soon."

  );


  /* ==========================================================================
     FREE RESOURCES
     ========================================================================== */

  renderComingSoon(

    freeEl,

    "📚",

    "Coming Soon",

    "Free learning resources will be available here soon."

  );


  /* ==========================================================================
     YOUTUBE SEARCH
     ========================================================================== */

  async function searchYouTube(payload) {

    if (!window.sb) {

      throw new Error(
        "Supabase client is not available."
      );

    }


    console.log(
      "IGCA Learn & Grow → learn-search:",
      payload
    );


    const {
      data,
      error
    } = await sb.functions.invoke(
      "learn-search",
      {
        body: payload
      }
    );


    if (error) {

      console.error(
        "IGCA learn-search error:",
        error
      );

      throw error;

    }


    console.log(
      "IGCA learn-search response:",
      data
    );


    if (!data) {

      throw new Error(
        "No response received from learn-search."
      );

    }


    if (!data.success) {

      throw new Error(
        data.error ||
        "Unable to load YouTube content."
      );

    }


    return Array.isArray(data.videos)
      ? data.videos
      : [];

  }


  /* ==========================================================================
     VIDEO CARD
     ========================================================================== */

  function videoCard(video) {

    const videoId =
      video?.id || "";

    const title =
      video?.title ||
      "Untitled video";

    const thumbnail =
      video?.thumbnail ||
      "";

    const channel =
      video?.channel ||
      "YouTube";


    /* ------------------------------------------------------------------------
       PUBLISHED DATE
       ------------------------------------------------------------------------ */

    let published = "";


    if (video?.publishedAt) {

      const date =
        new Date(video.publishedAt);


      if (!Number.isNaN(date.getTime())) {

        published =
          date.toLocaleDateString(
            "en-IN",
            {
              day: "numeric",
              month: "short",
              year: "numeric"
            }
          );

      }

    }


    /* ------------------------------------------------------------------------
       CARD
       ------------------------------------------------------------------------ */

    return `
      <article
        class="learn-card"
        data-video-id="${escapeHTML(videoId)}"
      >

        <button
          type="button"
          class="learn-card-media learn-video-trigger"
          data-video-id="${escapeHTML(videoId)}"
          aria-label="Play ${escapeHTML(title)}"
        >

          ${
            thumbnail
              ? `
                <img
                  src="${escapeHTML(thumbnail)}"
                  alt="${escapeHTML(title)}"
                  loading="lazy"
                >
              `
              : `
                <div class="learn-card-placeholder">
                  ▶
                </div>
              `
          }


          <span class="learn-card-play">
            ▶
          </span>

        </button>


        <div class="learn-card-body">

          <div class="learn-card-meta">

            <span>
              YouTube
            </span>

            ${
              published
                ? `
                  <span>
                    • ${escapeHTML(published)}
                  </span>
                `
                : ""
            }

          </div>


          <h3 class="learn-card-title">
            ${escapeHTML(title)}
          </h3>


          <p class="learn-card-channel">
            ${escapeHTML(channel)}
          </p>

        </div>

      </article>
    `;

  }


  /* ==========================================================================
     RENDER VIDEOS
     ========================================================================== */

  function renderVideos(
    container,
    videos,
    emptyMessage
  ) {

    if (!container) return;


    if (
      !Array.isArray(videos) ||
      !videos.length
    ) {

      container.innerHTML = `
        <div class="learn-empty">

          <div>

            <strong>
              No content found
            </strong>

            <p>
              ${escapeHTML(emptyMessage)}
            </p>

          </div>

        </div>
      `;

      return;

    }


    container.innerHTML =
      videos
        .map(videoCard)
        .join("");

  }


  /* ==========================================================================
     ERROR STATE
     ========================================================================== */

  function renderError(
    container,
    message
  ) {

    if (!container) return;


    container.innerHTML = `
      <div class="learn-error">

        <div>

          <strong>
            Unable to load content
          </strong>

          <p>
            ${escapeHTML(
              message ||
              "Please try again later."
            )}
          </p>

        </div>

      </div>
    `;

  }


  /* ==========================================================================
     INLINE YOUTUBE VIDEO PLAYER
     ========================================================================== */

  function openVideoPlayer(
    videoId,
    title = "YouTube Video"
  ) {

    if (!videoId) return;


    /* ------------------------------------------------------------------------
       Remove old player
       ------------------------------------------------------------------------ */

    const existing =
      document.getElementById(
        "igca-video-modal"
      );


    if (existing) {

      existing.remove();

    }


    /* ------------------------------------------------------------------------
       Create modal
       ------------------------------------------------------------------------ */

    const modal =
      document.createElement("div");


    modal.id =
      "igca-video-modal";


    modal.className =
      "igca-video-modal";


    modal.innerHTML = `

      <div
        class="igca-video-overlay"
        data-close-video="true"
      ></div>


      <div
        class="igca-video-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="${escapeHTML(title)}"
      >

        <button
          type="button"
          class="igca-video-close"
          aria-label="Close video"
          title="Close"
        >
          ×
        </button>


        <div class="igca-video-frame">

          <iframe
            src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0"
            title="${escapeHTML(title)}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>

        </div>

      </div>

    `;


    document.body.appendChild(
      modal
    );


    document.body.classList.add(
      "igca-video-open"
    );


    /* ------------------------------------------------------------------------
       Close player
       ------------------------------------------------------------------------ */

    function closePlayer() {

      const current =
        document.getElementById(
          "igca-video-modal"
        );


      if (current) {

        current.remove();

      }


      document.body.classList.remove(
        "igca-video-open"
      );


      document.removeEventListener(
        "keydown",
        escapeHandler
      );

    }


    /* ------------------------------------------------------------------------
       Close button
       ------------------------------------------------------------------------ */

    const closeButton =
      modal.querySelector(
        ".igca-video-close"
      );


    if (closeButton) {

      closeButton.addEventListener(
        "click",
        closePlayer
      );

    }


    /* ------------------------------------------------------------------------
       Overlay
       ------------------------------------------------------------------------ */

    const overlay =
      modal.querySelector(
        ".igca-video-overlay"
      );


    if (overlay) {

      overlay.addEventListener(
        "click",
        closePlayer
      );

    }


    /* ------------------------------------------------------------------------
       ESC key
       ------------------------------------------------------------------------ */

    function escapeHandler(event) {

      if (
        event.key === "Escape"
      ) {

        closePlayer();

      }

    }


    document.addEventListener(
      "keydown",
      escapeHandler
    );

  }


  /* ==========================================================================
     VIDEO CLICK HANDLER
     ========================================================================== */

  document.addEventListener(
    "click",
    event => {

      const trigger =
        event.target.closest(
          ".learn-video-trigger"
        );


      if (!trigger) return;


      const videoId =
        trigger.dataset.videoId;


      if (!videoId) return;


      const card =
        trigger.closest(
          ".learn-card"
        );


      const title =
        card
          ?.querySelector(
            ".learn-card-title"
          )
          ?.textContent
          ?.trim() ||
        "YouTube Video";


      openVideoPlayer(
        videoId,
        title
      );

    }
  );


  /* ==========================================================================
     LOAD LEARN CONTENT
     ========================================================================== */

  async function loadLearnContent() {

    /* ========================================================================
       INDUSTRY
       ======================================================================== */

    try {

      const industryVideos =
        await searchYouTube({

          query:
            "latest technology business career professional skills",

          industry:
            "professional development",

          country:
            "India"

        });


      renderVideos(

        industryEl,

        industryVideos,

        "Latest industry learning content will appear here."

      );

    } catch (error) {

      console.error(
        "IGCA Industry content error:",
        error
      );


      renderError(
        industryEl,
        error?.message
      );

    }


    /* ========================================================================
       COUNTRY
       ======================================================================== */

    try {

      const countryVideos =
        await searchYouTube({

          query:
            "latest India technology business education career skills",

          country:
            "India"

        });


      renderVideos(

        countryEl,

        countryVideos,

        "Latest learning content from India will appear here."

      );

    } catch (error) {

      console.error(
        "IGCA Country content error:",
        error
      );


      renderError(
        countryEl,
        error?.message
      );

    }


    /* ========================================================================
       NETWORK
       ======================================================================== */

    try {

      const networkVideos =
        await searchYouTube({

          query:
            "professional networking career growth leadership skills",

          country:
            "India"

        });


      renderVideos(

        networkEl,

        networkVideos,

        "Professional learning content will appear here."

      );

    } catch (error) {

      console.error(
        "IGCA Network content error:",
        error
      );


      renderError(
        networkEl,
        error?.message
      );

    }


    /* ========================================================================
       COURSES & CERTIFICATIONS
       ======================================================================== */

    renderComingSoon(

      coursesEl,

      "🎓",

      "Coming Soon",

      "Courses & Certifications will be available here soon."

    );


    /* ========================================================================
       FREE RESOURCES
       ======================================================================== */

    renderComingSoon(

      freeEl,

      "📚",

      "Coming Soon",

      "Free learning resources will be available here soon."

    );


    /* ========================================================================
       COMPLETE
       ======================================================================== */

    console.log(
      "IGCA Learn & Grow loaded successfully."
    );

  }


  /* ==========================================================================
     START
     ========================================================================== */

  await loadLearnContent();

});
