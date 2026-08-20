/* IGCA — Supabase Authentication */

document.addEventListener("DOMContentLoaded", () => {

  /* ==========================================
     LOGIN
  ========================================== */

  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value;

      if (!email || !password) {
        alert("Please enter your email and password.");
        return;
      }

      try {
        const { error } = await sb.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        window.location.href = "dashboard.html";

      } catch (error) {
        console.error("Login error:", error);
        alert(error.message);
      }
    });
  }
  
// Current User Profile Get Karein
async function getCurrentProfile() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) console.error("Error fetching profile:", profileError);
    return profile;
}

// Ensure Global Object Exists
window.PC = window.PC || {};
window.PC.auth = { getCurrentProfile };

  /* ==========================================
     SIGNUP
  ========================================== */

  const signupForm = document.getElementById("signup-form");

  if (signupForm) {

    signupForm.addEventListener("submit", async (e) => {

      e.preventDefault();

      const name =
        document.getElementById("name")?.value.trim();

      const email =
        document.getElementById("email")?.value.trim();

      const password =
        document.getElementById("password")?.value;

      /*
       * IMPORTANT:
       * Account type is a radio group, not an element
       * with id="accountType".
       */
      const selectedAccount =
        document.querySelector(
          'input[name="accountType"]:checked'
        );

      const accountType =
        selectedAccount?.value || "individual";


      /* ------------------------------------------
         Convert signup UI value to DB enum
      ------------------------------------------ */

      const accountTypeMap = {
        individual: "investor",
        company: "professional"
      };

      const dbAccountType =
        accountTypeMap[accountType] || "other";


      /* ------------------------------------------
         Validation
      ------------------------------------------ */

      if (!name) {
        alert("Please enter your full name.");
        return;
      }

      if (!email) {
        alert("Please enter your email.");
        return;
      }

      if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
      }


      /* ------------------------------------------
         Button loading state
      ------------------------------------------ */

      const button =
        document.getElementById("create-account");

      if (button) {
        button.disabled = true;

        const span =
          button.querySelector("span");

        if (span) {
          span.textContent = "Creating account...";
        }
      }


      try {

        console.log("IGCA: Starting signup...");

        const { data, error } =
          await sb.auth.signUp({

            email,

            password,

            options: {

              data: {
                full_name: name,
                account_type: dbAccountType
              }

            }

          });


        console.log("IGCA: Signup response:", data);


        if (error) {
          throw error;
        }


        /* ------------------------------------------
           Session exists
        ------------------------------------------ */

        if (data.session) {

          console.log(
            "IGCA: Signup successful. Session created."
          );

          window.location.href =
            "onboarding.html";

          return;
        }


        /* ------------------------------------------
           Email confirmation required
        ------------------------------------------ */

        console.log(
          "IGCA: Signup successful. Email confirmation required."
        );

        alert(
          "Account created successfully.\n\n" +
          "Please confirm your email, then log in."
        );

        window.location.href =
          "login.html";


      } catch (error) {

        console.error(
          "IGCA: Signup error:",
          error
        );

        alert(
          "Signup failed:\n\n" +
          error.message
        );


        if (button) {

          button.disabled = false;

          const span =
            button.querySelector("span");

          if (span) {
            span.textContent =
              "Create my account";
          }

        }

      }

    });

  }


  /* ==========================================
     ONBOARDING
  ========================================== */
const tiles = document.querySelectorAll(".option-tile");
const toStep2 = document.getElementById("to-step-2");

let selectedRole = null;
let selectedAccountType = null;

tiles.forEach(tile => {
  tile.addEventListener("click", () => {

    // Remove previous selection
    tiles.forEach(t => {
      t.classList.remove("selected");
    });

    // Select current tile
    tile.classList.add("selected");

    // Exact role selected by user
    selectedRole = tile.dataset.value;

    // Find parent group
    const group =
      tile.closest(".ob-tiles")?.dataset.group;

    // Convert UI group → valid database enum
    const accountTypeMap = {
      investor: "investor",
      professional: "professional",
      company: "other"
    };

    selectedAccountType =
      accountTypeMap[group] || "other";

    console.log("Selected role:", selectedRole);
    console.log("Selected account type:", selectedAccountType);

    // Enable Continue
    if (toStep2) {
      toStep2.disabled = false;
    }
  });
});

  tiles.forEach(tile => {

    tile.addEventListener("click", () => {

      tiles.forEach(t =>
        t.classList.remove("selected")
      );

      tile.classList.add("selected");

      selectedRole =
        tile.dataset.value;

      if (toStep2) {
        toStep2.disabled = false;
      }

    });

  });


  const step1 =
    document.getElementById("step-1");

  const step2 =
    document.getElementById("step-2");

  const step3 =
    document.getElementById("step-3");

  const progress =
    document.getElementById("progress");


  if (toStep2) {

    toStep2.addEventListener("click", () => {

      step1.style.display = "none";
      step2.style.display = "block";

      if (progress) {
        progress.style.width = "66%";
      }

    });

  }


  document
    .getElementById("to-step-1b")
    ?.addEventListener("click", () => {

      step2.style.display = "none";
      step1.style.display = "block";

      if (progress) {
        progress.style.width = "33%";
      }

    });


  document
    .getElementById("to-step-2b")
    ?.addEventListener("click", () => {

      step3.style.display = "none";
      step2.style.display = "block";

      if (progress) {
        progress.style.width = "66%";
      }

    });


  document
    .getElementById("to-step-3")
    ?.addEventListener("click", async () => {

      const industry =
        document.getElementById("ob-industry")?.value || "";

      const location =
        document.getElementById("ob-location")?.value.trim() || "";

      const expertise =
        (
          document.getElementById("ob-expertise")?.value || ""
        )
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

      const interests =
        (
          document.getElementById("ob-topics")?.value || ""
        )
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);


      try {

       if (!selectedAccountType) {
  alert("Please select an option in Step 1.");
  return;
}

const p = await IGCA_API.updateProfile({

  account_type: selectedAccountType,

  industry: industry || null,

  location: location || null,

  expertise: expertise,

  interests: interests

});
        step2.style.display = "none";
        step3.style.display = "block";

        if (progress) {
          progress.style.width = "100%";
        }


        const summary =
          document.getElementById("ob-summary");


        if (summary && p) {

          summary.innerHTML = `

            <div style="
              display:flex;
              gap:14px;
              align-items:center;
              margin-bottom:16px;
            ">

              ${App.avatarHTML(p.full_name)}

              <div>

                <h3 style="font-size:16px;">
                  ${p.full_name}
                </h3>

                <div
                  class="text-secondary"
                  style="font-size:13.5px;"
                >
                  ${p.account_type}
                </div>

              </div>

            </div>

            <div
              class="meta"
              style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:12px;
                font-size:13.5px;
              "
            >

              <div>
                <strong>Industry</strong><br>
                ${industry || "Not specified"}
              </div>

              <div>
                <strong>Location</strong><br>
                ${location || "Not specified"}
              </div>

              <div>
                <strong>Expertise</strong><br>
                ${expertise.join(", ") || "Not specified"}
              </div>

              <div>
                <strong>Interests</strong><br>
                ${interests.join(", ") || "Not specified"}
              </div>

            </div>

          `;

        }

      } catch (error) {

        console.error(
          "Onboarding profile update error:",
          error
        );

        alert(error.message);

      }

    });

});
