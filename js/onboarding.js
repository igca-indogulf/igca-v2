/* ==========================================================================
   IGCA — Onboarding
   Complete Professional Profile Setup
   Supabase-backed
   ========================================================================== */

"use strict";

document.addEventListener(
  "DOMContentLoaded",
  initOnboarding
);


/* ==========================================================================
   INIT
   ========================================================================== */

async function initOnboarding() {

  const step1 =
    document.getElementById("step-1");

  const step2 =
    document.getElementById("step-2");

  const step3 =
    document.getElementById("step-3");

  const step4 =
    document.getElementById("step-4");

  const progress =
    document.getElementById("progress");

  const counter =
    document.getElementById("step-counter");

  const toStep2 =
    document.getElementById("to-step-2");

  const toStep1 =
    document.getElementById("to-step-1b");

  const toStep3 =
    document.getElementById("to-step-3");

  const toStep2Back =
    document.getElementById("to-step-2b");

  const completeButton =
    document.getElementById("complete-profile");


  let selectedAccountType = null;


  /* ------------------------------------------------------------------------
     AUTH
  ------------------------------------------------------------------------ */

  try {

    if (
      !window.IGCA_API ||
      typeof IGCA_API.user !== "function"
    ) {
      throw new Error(
        "IGCA backend is not available."
      );
    }

    const user =
      await IGCA_API.user();

    if (!user) {

      window.location.href =
        "login.html";

      return;
    }


    /*
     * Load existing profile data if available.
     * This allows onboarding to resume without losing information.
     */

    if (
      typeof IGCA_API.profile ===
      "function"
    ) {

      try {

        const existingProfile =
          await IGCA_API.profile();

        if (existingProfile) {

          populateExistingProfile(
            existingProfile
          );

          if (
            existingProfile.account_type
          ) {

            selectedAccountType =
              existingProfile.account_type;

            selectExistingAccountType(
              selectedAccountType
            );

            toStep2.disabled =
              false;
          }
        }

      } catch (error) {

        console.warn(
          "Unable to load existing profile:",
          error
        );
      }
    }


  } catch (error) {

    console.error(
      "Onboarding authentication error:",
      error
    );

    alert(
      "Unable to start onboarding. Please login again."
    );

    window.location.href =
      "login.html";

    return;
  }


  /* ------------------------------------------------------------------------
     ACCOUNT TYPE
  ------------------------------------------------------------------------ */

  document
    .querySelectorAll(".option-tile")
    .forEach(tile => {

      tile.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".option-tile")
            .forEach(item => {

              item.classList.remove(
                "selected"
              );

            });


          tile.classList.add(
            "selected"
          );


          selectedAccountType =
            tile.dataset.value;


          toStep2.disabled =
            !selectedAccountType;

        }
      );

    });


  /* ------------------------------------------------------------------------
     STEP 1 → STEP 2
  ------------------------------------------------------------------------ */

  toStep2.addEventListener(
    "click",
    () => {

      if (!selectedAccountType) {

        alert(
          "Please select an account type."
        );

        return;
      }

      showStep(2);

    }
  );


  /* ------------------------------------------------------------------------
     STEP 2 → STEP 1
  ------------------------------------------------------------------------ */

  toStep1.addEventListener(
    "click",
    () => {

      showStep(1);

    }
  );


  /* ------------------------------------------------------------------------
     STEP 2 → STEP 3
  ------------------------------------------------------------------------ */

  toStep3.addEventListener(
    "click",
    () => {

      if (!validateProfileForm()) {
        return;
      }

      buildProfilePreview();

      showStep(3);

    }
  );


  /* ------------------------------------------------------------------------
     STEP 3 → STEP 2
  ------------------------------------------------------------------------ */

  toStep2Back.addEventListener(
    "click",
    () => {

      showStep(2);

    }
  );


  /* ------------------------------------------------------------------------
     COMPLETE PROFILE
  ------------------------------------------------------------------------ */

  completeButton.addEventListener(
    "click",
    async () => {

      await saveProfile();

    }
  );


  /* ==========================================================================
     SHOW STEP
     ========================================================================== */

  function showStep(number) {

    [
      step1,
      step2,
      step3,
      step4
    ].forEach(step => {

      if (step) {
        step.style.display =
          "none";
      }

    });


    if (number === 1) {

      step1.style.display =
        "block";

      progress.style.width =
        "33%";

      counter.textContent =
        "Step 1 of 3";

    }


    if (number === 2) {

      step2.style.display =
        "block";

      progress.style.width =
        "66%";

      counter.textContent =
        "Step 2 of 3";

    }


    if (number === 3) {

      step3.style.display =
        "block";

      progress.style.width =
        "100%";

      counter.textContent =
        "Step 3 of 3";

    }


    if (number === 4) {

      step4.style.display =
        "block";

      progress.style.width =
        "100%";

      counter.textContent =
        "Profile Complete";

    }


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  /* ==========================================================================
     VALIDATION
     ========================================================================== */

  function validateProfileForm() {

    const fullName =
      getInputValue("ob-full-name");

    const username =
      getInputValue("ob-username");

    if (!fullName) {

      alert(
        "Please enter your full name."
      );

      focusInput("ob-full-name");

      return false;
    }


    if (fullName.length < 2) {

      alert(
        "Please enter a valid full name."
      );

      focusInput("ob-full-name");

      return false;
    }


    if (!username) {

      alert(
        "Please choose a username."
      );

      focusInput("ob-username");

      return false;
    }


    if (!isValidUsername(username)) {

      alert(
        "Username can contain only letters, numbers, dots and underscores."
      );

      focusInput("ob-username");

      return false;
    }


    const website =
      getInputValue("ob-website");

    if (
      website &&
      !isValidWebsite(website)
    ) {

      alert(
        "Please enter a valid website URL."
      );

      focusInput("ob-website");

      return false;
    }


    return true;
  }


  /* ==========================================================================
     BUILD PREVIEW
     ========================================================================== */

  function buildProfilePreview() {

    const summary =
      document.getElementById(
        "ob-summary"
      );

    if (!summary) {
      return;
    }


    const fullName =
      getInputValue("ob-full-name") ||
      "IGCA Member";

    const username =
      getInputValue("ob-username");

    const headline =
      getInputValue("ob-headline");

    const company =
      getInputValue("ob-company");

    const website =
      getInputValue("ob-website");

    const industry =
      getInputValue("ob-industry");

    const location =
      getInputValue("ob-location");

    const bio =
      getInputValue("ob-bio");

    const expertise =
      parseList(
        getInputValue("ob-expertise")
      );

    const interests =
      parseList(
        getInputValue("ob-topics")
      );


    const initials =
      getInitials(fullName);


    summary.innerHTML = `

      <div class="profile-preview">

        <div class="preview-avatar">
          ${escapeHTML(initials)}
        </div>

        <div>

          <div class="preview-name">
            ${escapeHTML(fullName)}
          </div>

          ${
            username
              ? `
                <div class="preview-meta">
                  @${escapeHTML(username)}
                </div>
              `
              : ""
          }

          ${
            headline || company
              ? `
                <div class="preview-headline">
                  ${escapeHTML(
                    [headline, company]
                      .filter(Boolean)
                      .join(" at ")
                  )}
                </div>
              `
              : ""
          }

          ${
            [location, industry]
              .filter(Boolean)
              .length
              ? `
                <div class="preview-meta">
                  ${escapeHTML(
                    [location, industry]
                      .filter(Boolean)
                      .join(" · ")
                  )}
                </div>
              `
              : ""
          }

          ${
            website
              ? `
                <div class="preview-meta">
                  ${escapeHTML(website)}
                </div>
              `
              : ""
          }

        </div>

      </div>


      <div class="preview-about">

        <strong>
          About
        </strong>

        <div style="margin-top:7px;">
          ${
            bio
              ? escapeHTML(bio)
              : "No bio added."
          }
        </div>

      </div>


      <div style="margin-top:20px;">

        <strong>
          Account Type
        </strong>

        <div class="preview-chips">

          <span class="chip">
            ${escapeHTML(
              formatAccountType(
                selectedAccountType
              )
            )}
          </span>

        </div>

      </div>


      <div style="margin-top:20px;">

        <strong>
          Expertise
        </strong>

        <div class="preview-chips">

          ${
            expertise.length
              ? expertise
                  .map(item => `
                    <span class="chip">
                      ${escapeHTML(item)}
                    </span>
                  `)
                  .join("")
              : `
                <span class="text-secondary">
                  Not specified
                </span>
              `
          }

        </div>

      </div>


      <div style="margin-top:20px;">

        <strong>
          Interests
        </strong>

        <div class="preview-chips">

          ${
            interests.length
              ? interests
                  .map(item => `
                    <span class="chip">
                      ${escapeHTML(item)}
                    </span>
                  `)
                  .join("")
              : `
                <span class="text-secondary">
                  Not specified
                </span>
              `
          }

        </div>

      </div>

    `;

  }


  /* ==========================================================================
     SAVE PROFILE
     ========================================================================== */

  async function saveProfile() {

    if (!selectedAccountType) {

      alert(
        "Please select an account type."
      );

      showStep(1);

      return;
    }


    if (!validateProfileForm()) {

      showStep(2);

      return;
    }


    const originalText =
      completeButton.textContent;


    completeButton.disabled =
      true;

    completeButton.textContent =
      "Creating Profile...";


    const profileData = {

      account_type:
        selectedAccountType,

      full_name:
        getInputValue(
          "ob-full-name"
        ) || null,

      username:
        getInputValue(
          "ob-username"
        ).toLowerCase() || null,

      headline:
        getInputValue(
          "ob-headline"
        ) || null,

      company_name:
        getInputValue(
          "ob-company"
        ) || null,

      website:
        getInputValue(
          "ob-website"
        ) || null,

      industry:
        getInputValue(
          "ob-industry"
        ) || null,

      location:
        getInputValue(
          "ob-location"
        ) || null,

      expertise:
        parseList(
          getInputValue(
            "ob-expertise"
          )
        ),

      interests:
        parseList(
          getInputValue(
            "ob-topics"
          )
        ),

      bio:
        getInputValue(
          "ob-bio"
        ) || null

    };


    try {

      const updatedProfile =
        await IGCA_API.updateProfile(
          profileData
        );


      console.log(
        "IGCA profile created/updated:",
        updatedProfile
      );


      /*
       * Profile saved successfully.
       */

      showStep(4);


    } catch (error) {

      console.error(
        "Profile save failed:",
        error
      );


      let message =
        "Could not save your profile. Please try again.";


      if (
        error?.code ===
        "23505"
      ) {

        const errorText =
          String(
            error?.message ||
            ""
          ).toLowerCase();


        if (
          errorText.includes(
            "username"
          )
        ) {

          message =
            "This username is already taken. Please choose another username.";

        } else {

          message =
            "Some profile information is already in use. Please check your details.";

        }

      } else if (
        error?.message
      ) {

        message =
          error.message;

      }


      alert(message);


    } finally {

      completeButton.disabled =
        false;

      completeButton.textContent =
        originalText;

    }

  }

}


/* ==========================================================================
   EXISTING PROFILE
   ========================================================================== */

function populateExistingProfile(
  profile
) {

  setInput(
    "ob-full-name",
    profile.full_name
  );

  setInput(
    "ob-username",
    profile.username
  );

  setInput(
    "ob-headline",
    profile.headline
  );

  setInput(
    "ob-company",
    profile.company_name
  );

  setInput(
    "ob-website",
    profile.website
  );

  setInput(
    "ob-industry",
    profile.industry
  );

  setInput(
    "ob-location",
    profile.location
  );

  setInput(
    "ob-bio",
    profile.bio
  );


  setInput(
    "ob-expertise",
    Array.isArray(
      profile.expertise
    )
      ? profile.expertise.join(", ")
      : ""
  );


  setInput(
    "ob-topics",
    Array.isArray(
      profile.interests
    )
      ? profile.interests.join(", ")
      : ""
  );

}


/* ==========================================================================
   SELECT EXISTING ACCOUNT TYPE
   ========================================================================== */

function selectExistingAccountType(
  accountType
) {

  document
    .querySelectorAll(".option-tile")
    .forEach(tile => {

      if (
        tile.dataset.value ===
        accountType
      ) {

        tile.classList.add(
          "selected"
        );

      }

    });

}


/* ==========================================================================
   INPUT HELPERS
   ========================================================================== */

function getInputValue(id) {

  const element =
    document.getElementById(id);

  if (!element) {
    return "";
  }

  return String(
    element.value || ""
  ).trim();

}


function setInput(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (!element) {
    return;
  }

  element.value =
    value ?? "";

}


function focusInput(id) {

  const element =
    document.getElementById(id);

  if (element) {

    element.focus();

    element.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }

}


/* ==========================================================================
   LIST PARSER
   ========================================================================== */

function parseList(value) {

  if (!value) {
    return [];
  }

  return [
    ...new Set(
      String(value)
        .split(",")
        .map(item =>
          item.trim()
        )
        .filter(Boolean)
    )
  ];

}


/* ==========================================================================
   USERNAME VALIDATION
   ========================================================================== */

function isValidUsername(
  username
) {

  return /^[a-zA-Z0-9._]{3,30}$/
    .test(username);

}


/* ==========================================================================
   WEBSITE VALIDATION
   ========================================================================== */

function isValidWebsite(
  website
) {

  try {

    const url =
      new URL(website);

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );

  } catch {

    return false;

  }

}


/* ==========================================================================
   INITIALS
   ========================================================================== */

function getInitials(
  name
) {

  const parts =
    String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (!parts.length) {
    return "IG";
  }


  if (parts.length === 1) {

    return parts[0]
      .slice(0, 2)
      .toUpperCase();

  }


  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();

}


/* ==========================================================================
   ACCOUNT TYPE LABEL
   ========================================================================== */

function formatAccountType(
  type
) {

  const labels = {

    investor:
      "Investor",

    professional:
      "Professional",

    founder:
      "Founder / Company"

  };


  return (
    labels[type] ||
    type ||
    "Not specified"
  );

}


/* ==========================================================================
   ESCAPE HTML
   ========================================================================== */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}