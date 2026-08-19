/* ==========================================================================
   IGCA — SETTINGS
   ==========================================================================
   Live Supabase Settings
   - Profile load/update
   - Avatar upload
   - Notification preferences
   - Privacy preferences
   - Password update
   ========================================================================== */

(function () {

  "use strict";


  /* ========================================================================
     ELEMENT HELPERS
  ======================================================================== */

  const $ = (id) => document.getElementById(id);

  const messageEl = $("settings-message");


  function showMessage(message, type = "success") {

    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className =
      `settings-message ${type}`;

    clearTimeout(showMessage.timer);

    showMessage.timer = setTimeout(() => {

      messageEl.textContent = "";
      messageEl.className = "settings-message";

    }, 4500);
  }


  function getCurrentUser() {

    if (
      !window.sb ||
      !window.sb.auth
    ) {
      throw new Error("Supabase is not initialized.");
    }

    return window.sb.auth.getUser();
  }


  /* ========================================================================
     SAFE VALUE SETTERS
  ======================================================================== */

  function setValue(id, value) {

    const element = $(id);

    if (!element) return;

    element.value =
      value === null ||
      value === undefined
        ? ""
        : value;
  }


  function setChecked(setting, value) {

    const element =
      document.querySelector(
        `[data-setting="${setting}"]`
      );

    if (element) {
      element.checked = !!value;
    }
  }


  /* ========================================================================
     PROFILE AVATAR
  ======================================================================== */

  function renderAvatar(profile) {

    const avatar =
      $("settings-avatar");

    if (!avatar) return;


    const name =
      profile?.full_name ||
      profile?.username ||
      "IGCA";


    if (profile?.avatar_url) {

      avatar.innerHTML = `
        <img
          src="${escapeAttribute(profile.avatar_url)}"
          alt="${escapeAttribute(name)}"
        >
      `;

      const image =
        avatar.querySelector("img");

      if (image) {

        image.addEventListener(
          "error",
          () => {

            avatar.textContent =
              getInitials(name);

          },
          {
            once: true
          }
        );

      }

    } else {

      avatar.textContent =
        getInitials(name);

    }
  }


  function getInitials(name) {

    const value =
      String(name || "IG")
        .trim();

    if (!value) {
      return "IG";
    }

    return value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase();
  }


  function escapeAttribute(value) {

    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }


  /* ========================================================================
     LOAD PROFILE
  ======================================================================== */

  async function loadProfile(userId) {

    const {
      data,
      error
    } =
      await window.sb
        .from("profiles")
        .select(`
          id,
          full_name,
          username,
          headline,
          bio,
          avatar_url,
          location,
          industry,
          company_name,
          website,
          phone,
          country,
          account_type
        `)
        .eq("id", userId)
        .maybeSingle();


    if (error) {

      console.error(
        "IGCA: Profile load failed:",
        error
      );

      throw error;
    }


    if (!data) {

      throw new Error(
        "Your profile could not be found."
      );
    }


    setValue(
      "settings-full-name",
      data.full_name
    );

    setValue(
      "settings-username",
      data.username
    );

    setValue(
      "settings-headline",
      data.headline
    );

    setValue(
      "settings-company",
      data.company_name
    );

    setValue(
      "settings-location",
      data.location
    );

    setValue(
      "settings-industry",
      data.industry
    );

    setValue(
      "settings-country",
      data.country
    );

    setValue(
      "settings-phone",
      data.phone
    );

    setValue(
      "settings-website",
      data.website
    );

    setValue(
      "settings-bio",
      data.bio
    );


    renderAvatar(data);


    return data;
  }


  /* ========================================================================
     LOAD SETTINGS
  ======================================================================== */

  async function loadSettings(userId) {

    const {
      data,
      error
    } =
      await window.sb
        .from("user_settings")
        .select(`
          notification_connections,
          notification_messages,
          notification_meetings,
          notification_digest,
          privacy_profile,
          privacy_mutual,
          privacy_search
        `)
        .eq("user_id", userId)
        .maybeSingle();


    if (error) {

      console.error(
        "IGCA: Settings load failed:",
        error
      );

      throw error;
    }


    /*
      If settings row doesn't exist,
      create the default row.
    */

    if (!data) {

      const {
        data: created,
        error: createError
      } =
        await window.sb
          .from("user_settings")
          .insert({
            user_id: userId
          })
          .select()
          .single();


      if (createError) {

        console.error(
          "IGCA: Could not create settings:",
          createError
        );

        throw createError;
      }


      applySettings(created);

      return created;
    }


    applySettings(data);

    return data;
  }


  function applySettings(data) {

    if (!data) return;


    setChecked(
      "connection_requests",
      data.notification_connections
    );

    setChecked(
      "messages",
      data.notification_messages
    );

    setChecked(
      "meeting_reminders",
      data.notification_meetings
    );

    setChecked(
      "weekly_digest",
      data.notification_digest
    );


    setChecked(
      "show_profile",
      data.privacy_profile
    );

    setChecked(
      "show_mutual_connections",
      data.privacy_mutual
    );

    setChecked(
      "appear_in_search",
      data.privacy_search
    );
  }


  /* ========================================================================
     SAVE PROFILE
  ======================================================================== */

  async function saveProfile() {

    const {
      data: userData,
      error: userError
    } =
      await getCurrentUser();


    if (userError || !userData?.user) {

      throw new Error(
        "You are not logged in."
      );
    }


    const userId =
      userData.user.id;


    const fullName =
      $("settings-full-name")?.value.trim();


    if (!fullName) {

      throw new Error(
        "Full name is required."
      );
    }


    const payload = {

      full_name:
        fullName,

      username:
        $("settings-username")?.value.trim() || null,

      headline:
        $("settings-headline")?.value.trim() || null,

      company_name:
        $("settings-company")?.value.trim() || null,

      location:
        $("settings-location")?.value.trim() || null,

      industry:
        $("settings-industry")?.value.trim() || null,

      country:
        $("settings-country")?.value.trim() || null,

      phone:
        $("settings-phone")?.value.trim() || null,

      website:
        $("settings-website")?.value.trim() || null,

      bio:
        $("settings-bio")?.value.trim() || null,

      updated_at:
        new Date().toISOString()
    };


    const {
      error
    } =
      await window.sb
        .from("profiles")
        .update(payload)
        .eq("id", userId);


    if (error) {

      console.error(
        "IGCA: Profile update failed:",
        error
      );

      throw error;
    }


    /*
      Refresh sidebar/header profile immediately.
    */

    if (
      window.App &&
      typeof App.hydrateUserChrome === "function"
    ) {

      await App.hydrateUserChrome();

    }


    /*
      Update avatar initials if required.
    */

    renderAvatar({
      full_name: fullName,
      avatar_url:
        $("settings-avatar")
          ?.querySelector("img")
          ?.src || null
    });


    showMessage(
      "Profile updated successfully.",
      "success"
    );
  }


  /* ========================================================================
     SAVE NOTIFICATION / PRIVACY SETTINGS
  ======================================================================== */

  async function savePreference(setting) {

    const {
      data: userData,
      error: userError
    } =
      await getCurrentUser();


    if (userError || !userData?.user) {

      throw new Error(
        "You are not logged in."
      );
    }


    const userId =
      userData.user.id;


    const checkbox =
      document.querySelector(
        `[data-setting="${setting}"]`
      );


    if (!checkbox) {
      return;
    }


    const value =
      checkbox.checked;


    const mapping = {

      connection_requests:
        "notification_connections",

      messages:
        "notification_messages",

      meeting_reminders:
        "notification_meetings",

      weekly_digest:
        "notification_digest",

      show_profile:
        "privacy_profile",

      show_mutual_connections:
        "privacy_mutual",

      appear_in_search:
        "privacy_search"

    };


    const column =
      mapping[setting];


    if (!column) {

      console.warn(
        "IGCA: Unknown setting:",
        setting
      );

      return;
    }


    /*
      UPSERT means:
      - update existing row
      - create it if missing
    */

    const {
      error
    } =
      await window.sb
        .from("user_settings")
        .upsert(
          {
            user_id: userId,
            [column]: value,
            updated_at:
              new Date().toISOString()
          },
          {
            onConflict: "user_id"
          }
        );


    if (error) {

      console.error(
        "IGCA: Preference update failed:",
        error
      );

      throw error;
    }


    showMessage(
      "Settings updated.",
      "success"
    );
  }


  /* ========================================================================
     AVATAR UPLOAD
  ======================================================================== */

  async function uploadAvatar() {

    const input =
      $("profile-image-input");


    if (!input?.files?.length) {

      showMessage(
        "Please choose an image first.",
        "error"
      );

      return;
    }


    const file =
      input.files[0];


    /* 5 MB */

    if (file.size > 5 * 1024 * 1024) {

      showMessage(
        "Image must be smaller than 5 MB.",
        "error"
      );

      return;
    }


    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];


    if (!allowedTypes.includes(file.type)) {

      showMessage(
        "Only JPG, PNG or WebP images are allowed.",
        "error"
      );

      return;
    }


    const {
      data: userData,
      error: userError
    } =
      await getCurrentUser();


    if (userError || !userData?.user) {

      throw new Error(
        "You are not logged in."
      );
    }


    const userId =
      userData.user.id;


    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();


    /*
      Each upload gets a unique filename.
      This avoids browser/CDN caching problems.
    */

    const filePath =
      `${userId}/${Date.now()}.${extension}`;


    const uploadButton =
      $("upload-profile-image");


    if (uploadButton) {

      uploadButton.disabled = true;
      uploadButton.textContent =
        "Uploading...";
    }


    try {

      const {
        error: uploadError
      } =
        await window.sb.storage
          .from("avatars")
          .upload(
            filePath,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type
            }
          );


      if (uploadError) {

        console.error(
          "IGCA: Avatar upload failed:",
          uploadError
        );

        throw uploadError;
      }


      const {
        data: publicData
      } =
        window.sb.storage
          .from("avatars")
          .getPublicUrl(filePath);


      const avatarUrl =
        publicData?.publicUrl;


      if (!avatarUrl) {

        throw new Error(
          "Could not generate avatar URL."
        );
      }


      const {
        error: profileError
      } =
        await window.sb
          .from("profiles")
          .update({
            avatar_url: avatarUrl,
            updated_at:
              new Date().toISOString()
          })
          .eq("id", userId);


      if (profileError) {

        console.error(
          "IGCA: Avatar profile update failed:",
          profileError
        );

        throw profileError;
      }


      renderAvatar({
        full_name:
          $("settings-full-name")?.value ||
          "IGCA",
        avatar_url:
          avatarUrl
      });


      /*
        Refresh sidebar/header avatar.
      */

      if (
        window.App &&
        typeof App.hydrateUserChrome === "function"
      ) {

        await App.hydrateUserChrome();

      }


      showMessage(
        "Profile photo updated successfully.",
        "success"
      );


      input.value = "";


      if (uploadButton) {

        uploadButton.style.display =
          "none";

      }

    } finally {

      if (uploadButton) {

        uploadButton.disabled =
          false;

        uploadButton.textContent =
          "Upload Photo";

      }

    }
  }


  /* ========================================================================
     PASSWORD UPDATE
  ======================================================================== */

  async function updatePassword() {

    const currentPassword =
      $("current-password")?.value || "";

    const newPassword =
      $("new-password")?.value || "";

    const confirmPassword =
      $("confirm-password")?.value || "";


    if (!currentPassword) {

      throw new Error(
        "Enter your current password."
      );
    }


    if (!newPassword) {

      throw new Error(
        "Enter a new password."
      );
    }


    if (newPassword.length < 6) {

      throw new Error(
        "New password must be at least 6 characters."
      );
    }


    if (newPassword !== confirmPassword) {

      throw new Error(
        "New passwords do not match."
      );
    }


    const {
      data: userData,
      error: userError
    } =
      await getCurrentUser();


    if (userError || !userData?.user) {

      throw new Error(
        "You are not logged in."
      );
    }


    const user =
      userData.user;


    if (!user.email) {

      throw new Error(
        "No email is associated with this account."
      );
    }


    /*
      Verify current password first.
      This prevents changing password just because
      the browser currently has an active session.
    */

    const {
      error: verifyError
    } =
      await window.sb.auth.signInWithPassword({
        email:
          user.email,
        password:
          currentPassword
      });


    if (verifyError) {

      throw new Error(
        "Current password is incorrect."
      );
    }


    const {
      error
    } =
      await window.sb.auth.updateUser({
        password:
          newPassword
      });


    if (error) {

      console.error(
        "IGCA: Password update failed:",
        error
      );

      throw error;
    }


    $("current-password").value = "";
    $("new-password").value = "";
    $("confirm-password").value = "";


    showMessage(
      "Password updated successfully.",
      "success"
    );
  }


  /* ========================================================================
     SETTINGS TABS
  ======================================================================== */

  function initTabs() {

    const buttons =
      document.querySelectorAll(
        ".settings-nav button"
      );


    const panels =
      document.querySelectorAll(
        ".settings-panel"
      );


    buttons.forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const panelName =
            button.dataset.panel;


          buttons.forEach(btn => {

            btn.classList.toggle(
              "active",
              btn === button
            );

          });


          panels.forEach(panel => {

            panel.classList.toggle(
              "active",
              panel.id ===
              `panel-${panelName}`
            );

          });

        }
      );

    });
  }


  /* ========================================================================
     PROFILE IMAGE UI
  ======================================================================== */

  function initAvatarControls() {

    const chooseButton =
      $("choose-profile-image");

    const input =
      $("profile-image-input");

    const uploadButton =
      $("upload-profile-image");


    if (
      !chooseButton ||
      !input
    ) {
      return;
    }


    chooseButton.addEventListener(
      "click",
      () => {

        input.click();

      }
    );


    input.addEventListener(
      "change",
      () => {

        if (!input.files?.length) {

          if (uploadButton) {
            uploadButton.style.display =
              "none";
          }

          return;
        }


        if (uploadButton) {

          uploadButton.style.display =
            "inline-flex";

        }

      }
    );


    if (uploadButton) {

      uploadButton.addEventListener(
        "click",
        async () => {

          try {

            await uploadAvatar();

          } catch (error) {

            console.error(error);

            showMessage(
              error.message ||
              "Could not upload profile photo.",
              "error"
            );

          }

        }
      );

    }

  }


  /* ========================================================================
     EVENT LISTENERS
  ======================================================================== */

  function initEvents() {

    const saveProfileButton =
      $("save-profile-btn");


    if (saveProfileButton) {

      saveProfileButton.addEventListener(
        "click",
        async () => {

          const originalText =
            saveProfileButton.textContent;

          try {

            saveProfileButton.disabled =
              true;

            saveProfileButton.textContent =
              "Saving...";


            await saveProfile();

          } catch (error) {

            console.error(error);

            showMessage(
              error.message ||
              "Could not save profile.",
              "error"
            );

          } finally {

            saveProfileButton.disabled =
              false;

            saveProfileButton.textContent =
              originalText;

          }

        }
      );

    }


    /*
      Notification + privacy switches
      save immediately when toggled.
    */

    document
      .querySelectorAll(
        "[data-setting]"
      )
      .forEach(element => {

        element.addEventListener(
          "change",
          async () => {

            try {

              await savePreference(
                element.dataset.setting
              );

            } catch (error) {

              console.error(error);

              /*
                Re-load the saved value if
                the update failed.
              */

              try {

                const {
                  data: userData
                } =
                  await getCurrentUser();

                if (userData?.user) {

                  await loadSettings(
                    userData.user.id
                  );

                }

              } catch (_) {}


              showMessage(
                error.message ||
                "Could not update setting.",
                "error"
              );

            }

          }
        );

      });


    const passwordButton =
      $("update-password-btn");


    if (passwordButton) {

      passwordButton.addEventListener(
        "click",
        async () => {

          const originalText =
            passwordButton.textContent;

          try {

            passwordButton.disabled =
              true;

            passwordButton.textContent =
              "Updating...";


            await updatePassword();

          } catch (error) {

            console.error(error);

            showMessage(
              error.message ||
              "Could not update password.",
              "error"
            );

          } finally {

            passwordButton.disabled =
              false;

            passwordButton.textContent =
              originalText;

          }

        }
      );

    }

  }


  /* ========================================================================
     INITIALIZATION
  ======================================================================== */

  async function initSettings() {

    try {

      if (
        !window.sb ||
        !window.sb.auth
      ) {

        throw new Error(
          "Supabase is not initialized."
        );
      }


      const {
        data,
        error
      } =
        await window.sb.auth.getUser();


      if (error || !data?.user) {

        return;
      }


      const userId =
        data.user.id;


      /*
        Load profile and preferences
        independently so one doesn't
        hide the other.
      */

      await Promise.all([
        loadProfile(userId),
        loadSettings(userId)
      ]);


      initTabs();
      initAvatarControls();
      initEvents();


    } catch (error) {

      console.error(
        "IGCA: Settings initialization failed:",
        error
      );


      showMessage(
        error.message ||
        "Could not load settings.",
        "error"
      );

    }

  }


  /* ========================================================================
     DOM READY
  ======================================================================== */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initSettings,
      {
        once: true
      }
    );

  } else {

    initSettings();

  }


  /* ========================================================================
     OPTIONAL PUBLIC API
  ======================================================================== */

  window.IGCA_SETTINGS = {

    reload: initSettings,
    loadProfile,
    loadSettings,
    saveProfile,
    uploadAvatar,
    updatePassword

  };

})();