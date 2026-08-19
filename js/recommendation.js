/* ==========================================================================
   IGCA — Learn & Grow Recommendation Engine
   Profile → Personalized Content Queries
   ========================================================================== */

(function () {

  "use strict";


  /* ------------------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------------------ */

  function clean(value) {

    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");

  }


  function normalizeCountry(country) {

    const value =
      clean(country).toLowerCase();

    if (!value) {
      return "India";
    }

    const countries = {
      india: "India",
      in: "India",
      uae: "United Arab Emirates",
      usa: "United States",
      us: "United States",
      uk: "United Kingdom",
      saudi: "Saudi Arabia"
    };

    return (
      countries[value] ||
      clean(country)
    );

  }


  function normalizeLocation(location) {

    const value =
      clean(location);

    if (!value) {
      return "";
    }

    /*
     * Examples:
     *
     * Mumbai, MH
     * Bengaluru, KA
     * Delhi NCR
     */

    return value
      .replace(/\s*,\s*[A-Z]{2}$/i, "")
      .trim();

  }


  /* ------------------------------------------------------------------------
     INDUSTRY KEYWORDS
     ------------------------------------------------------------------------ */

  function industryKeywords(industry) {

    const value =
      clean(industry);

    if (!value) {
      return [];
    }


    const keywords = [
      value
    ];


    const lower =
      value.toLowerCase();


    const mappings = [

      {
        match: [
          "investment",
          "private equity",
          "venture capital",
          "wealth",
          "financial",
          "finance"
        ],
        add: [
          "Investment",
          "Finance",
          "Business"
        ]
      },

      {
        match: [
          "technology",
          "software",
          "information technology",
          "it"
        ],
        add: [
          "Technology",
          "Software",
          "Tech"
        ]
      },

      {
        match: [
          "marketing",
          "advertising"
        ],
        add: [
          "Marketing",
          "Digital Marketing",
          "Advertising"
        ]
      },

      {
        match: [
          "healthcare",
          "health"
        ],
        add: [
          "Healthcare",
          "Health"
        ]
      }

    ];


    for (
      const mapping
      of mappings
    ) {

      if (
        mapping.match.some(
          keyword =>
            lower.includes(keyword)
        )
      ) {

        keywords.push(
          ...mapping.add
        );

      }

    }


    return [
      ...new Set(
        keywords
          .map(clean)
          .filter(Boolean)
      )
    ];

  }


  /* ------------------------------------------------------------------------
     QUERY GENERATOR
     ------------------------------------------------------------------------ */

  function generateQueries(profile) {

    if (!profile) {
      return [];
    }


    const industry =
      clean(profile.industry);


    const country =
      normalizeCountry(
        profile.country
      );


    const location =
      normalizeLocation(
        profile.location
      );


    if (!industry) {
      return [
        `${country} business`,
        `${country} professional development`,
        `${country} industry news`
      ];
    }


    const industries =
      industryKeywords(
        industry
      );


    const queries = [];


    /*
     * ---------------------------------------------------------------
     * PRIMARY — Industry + Country
     * ---------------------------------------------------------------
     */

    industries.forEach(
      keyword => {

        queries.push(
          `${keyword} ${country}`
        );

      }
    );


    /*
     * ---------------------------------------------------------------
     * SECONDARY — Industry + Location
     * ---------------------------------------------------------------
     */

    if (location) {

      queries.push(
        `${industry} ${location}`
      );

    }


    /*
     * ---------------------------------------------------------------
     * INDUSTRY-SPECIFIC NEWS
     * ---------------------------------------------------------------
     */

    queries.push(
      `${industry} news ${country}`
    );


    /*
     * ---------------------------------------------------------------
     * INDUSTRY EDUCATION
     * ---------------------------------------------------------------
     */

    queries.push(
      `${industry} explained ${country}`
    );


    /*
     * Remove duplicates.
     */

    return [
      ...new Set(
        queries
          .map(clean)
          .filter(Boolean)
      )
    ]
      .slice(0, 8);

  }


  /* ------------------------------------------------------------------------
     CATEGORY
     ------------------------------------------------------------------------ */

  function getContentCategory(profile) {

    const industry =
      clean(profile?.industry)
        .toLowerCase();


    if (
      industry.includes("investment") ||
      industry.includes("wealth") ||
      industry.includes("finance") ||
      industry.includes("private equity") ||
      industry.includes("venture capital")
    ) {

      return "Finance & Investment";

    }


    if (
      industry.includes("technology") ||
      industry.includes("software") ||
      industry.includes("it")
    ) {

      return "Technology";

    }


    if (
      industry.includes("marketing") ||
      industry.includes("advertising")
    ) {

      return "Marketing";

    }


    if (
      industry.includes("health")
    ) {

      return "Healthcare";

    }


    return industry ||
      "Business & Professional";

  }


  /* ------------------------------------------------------------------------
     PUBLIC API
     ------------------------------------------------------------------------ */

  window.IGCA_LEARN =
    window.IGCA_LEARN || {};


  window.IGCA_LEARN.generateQueries =
    generateQueries;


  window.IGCA_LEARN.getContentCategory =
    getContentCategory;


  window.IGCA_LEARN.normalizeCountry =
    normalizeCountry;


  window.IGCA_LEARN.normalizeLocation =
    normalizeLocation;
async function searchLearnContent({
  query,
  industry,
  location,
  country = "India"
}) {
  try {
    const {
      data,
      error
    } = await sb.functions.invoke(
      "learn-search",
      {
        body: {
          query,
          industry,
          location,
          country
        }
      }
    );

    if (error) {
      throw error;
    }

    return data?.videos || [];

  } catch (error) {

    console.error(
      "IGCA Learn Search failed:",
      error
    );

    return [];
  }
}
window.searchLearnContent = searchLearnContent;
  console.log(
    
    "IGCA Learn Recommendation Engine loaded."
  );

})();

