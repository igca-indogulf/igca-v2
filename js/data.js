/* ==========================================================================
   IGCA — Local Data Layer
   Demo/sample content has been removed so every new user gets a clean,
   empty state. currentUser below is just a placeholder shown for a moment
   before App.hydrateUserChrome() replaces it with the real logged-in
   user's name/title from Supabase. Feed arrays (people, companies,
   opportunities, insights, conversations, appointments, notifications)
   are intentionally empty — pages should show an empty-state message
   until they're wired to live IGCA_API queries.
   ========================================================================== */

const DATA = {
  currentUser:{
    name:"",
    initials:"",
    title:"",
    company:"",
    location:""
  },

  people:[],

  companies:[],

  opportunities:[],

  insights:[],

  learn:{
    industry:[],
    country:[],
    network:[],
    courses:[],
    free:[]
  },

  conversations:[],

  appointments:{
    upcoming:[],
    pending:[],
    completed:[]
  },

  notifications:[]
};
