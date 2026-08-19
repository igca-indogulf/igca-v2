/* ==========================================================================
   IGCA — Learn & Grow
   Dynamic YouTube Learning Content
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  "use strict";

  /* ------------------------------------------------------------------------
     SHELL
     ------------------------------------------------------------------------ */

  if (window.App && typeof App.mountShell === "function") {
    App.mountShell("learn.html");
  }


  /* ------------------------------------------------------------------------
     DOM
     ------------------------------------------------------------------------ */

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


  /* ------------------------------------------------------------------------
     LOADING
     ------------------------------------------------------------------------ */

  function loading(container) {

    if (!container) return;

    container.innerHTML = `
      <div class="learn-loading">
        <div class="learn-loading-spinner"></div>
        <span>Loading latest content...</span>
      </div>
    `;
  }


  [
    industryEl,
    countryEl,
    networkEl,
    coursesEl,
    freeEl
  ].forEach(loading);


  /* ------------------------------------------------------------------------
     ESCAPE HTML
     ------------------------------------------------------------------------ */

  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  /* ------------------------------------------------------------------------
     SEARCH YOUTUBE
     ------------------------------------------------------------------------ */

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


  /* ------------------------------------------------------------------------
     VIDEO CARD
     ------------------------------------------------------------------------ */

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

    const url =
      video?.url ||
      (
        videoId
          ? `https://www.youtube.com/watch?v=${videoId}`
          : "#"
      );

    let published =
      "";

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


    return `
      <article class="learn-card">

        <a
          class="learn-card-media"
          href="${escapeHTML(url)}"
          target="_blank"
          rel="noopener noreferrer"
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

        </a>


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


          <a
            class="learn-card-button"
            href="${escapeHTML(url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Watch on YouTube
          </a>

        </div>

      </article>
    `;

  }


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  function render(
    container,
    videos,
    emptyMessage
  ) {

    if (!container) return;


    if (!Array.isArray(videos) || !videos.length) {

      container.innerHTML = `
        <div class="learn-empty">

          <strong>
            No content found
          </strong>

          <p>
            ${escapeHTML(emptyMessage)}
          </p>

        </div>
      `;

      return;
    }


    container.innerHTML =
      videos
        .map(videoCard)
        .join("");

  }


  /* ------------------------------------------------------------------------
     ERROR
     ------------------------------------------------------------------------ */

  function renderError(
    container,
    message = "Unable to load content."
  ) {

    if (!container) return;

    container.innerHTML = `
      <div class="learn-error">

        <strong>
          Unable to load content
        </strong>

        <p>
          ${escapeHTML(message)}
        </p>

      </div>
    `;

  }


  /* ------------------------------------------------------------------------
     LOAD
     ------------------------------------------------------------------------ */

  async function loadLearnContent() {

    try {

      /*
       * ------------------------------------------------------------
       * INDUSTRY
       * ------------------------------------------------------------
       */

      const industry =
        await searchYouTube({
          query:
            "latest technology business career professional skills",
          industry:
            "professional development",
          country:
            "India"
        });

      render(
        industryEl,
        industry,
        "Latest industry learning content will appear here."
      );


      /*
       * ------------------------------------------------------------
       * COUNTRY
       * ------------------------------------------------------------
       */

      const country =
        await searchYouTube({
          query:
            "latest India technology business education career skills",
          country:
            "India"
        });

      render(
        countryEl,
        country,
        "Latest learning content from India will appear here."
      );


      /*
       * ------------------------------------------------------------
       * NETWORK
       * ------------------------------------------------------------
       */

      const network =
        await searchYouTube({
          query:
            "professional networking career growth leadership skills",
          country:
            "India"
        });

      render(
        networkEl,
        network,
        "Professional learning content will appear here."
      );


      /*
       * ------------------------------------------------------------
       * COURSES
       * ------------------------------------------------------------
       */

      const courses =
        await searchYouTube({
          query:
            "latest online courses certifications tutorials professional skills",
          country:
            "India"
        });

      render(
        coursesEl,
        courses,
        "Courses and certifications will appear here."
      );


      /*
       * ------------------------------------------------------------
       * FREE RESOURCES
       * ------------------------------------------------------------
       */

      const free =
        await searchYouTube({
          query:
            "free tutorials learning resources programming technology career",
          country:
            "India"
        });

      render(
        freeEl,
        free,
        "Free learning resources will appear here."
      );


      console.log(
        "IGCA Learn & Grow loaded successfully."
      );

    } catch (error) {

      console.error(
        "IGCA Learn & Grow Error:",
        error
      );


      const errorMessage =
        error?.message ||
        "Unable to load learning content.";


      [
        industryEl,
        countryEl,
        networkEl,
        coursesEl,
        freeEl
      ].forEach(container => {

        renderError(
          container,
          errorMessage
        );

      });

    }

  }


  /* ------------------------------------------------------------------------
     START
     ------------------------------------------------------------------------ */

  await loadLearnContent();

});
