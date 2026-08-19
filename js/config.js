// IGCA Supabase Configuration

window.IGCA_CONFIG = {
    SUPABASE_URL: "https://qsuhvvahupkrimubiman.supabase.co",

    // Supabase Dashboard → Project Settings → API
    // se apni anon/publishable key yahan paste karo.
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzdWh2dmFodXBrcmltdWJpbWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MjQ3NjMsImV4cCI6MjEwMjAwMDc2M30.KLAk2M3U9Z6aGTpqqbylA9tcR0TBlcnR2Fc8ICxRuZc"
};

console.log("IGCA_CONFIG loaded:", {
    url: window.IGCA_CONFIG.SUPABASE_URL,
    keyLoaded: !!window.IGCA_CONFIG.SUPABASE_ANON_KEY
});