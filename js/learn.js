/* ==========================================================================
   IGCA — Learn & Grow Page Logic
   ========================================================================== */

document.addEventListener("DOMContentLoaded", ()=>{
  App.mountShell("learn.html");

  const sections = [
    ["learn-industry", DATA.learn.industry, "No industry content yet"],
    ["learn-country", DATA.learn.country, "No regional content yet"],
    ["learn-network", DATA.learn.network, "Nothing shared by your network yet"],
    ["learn-courses", DATA.learn.courses, "No courses yet"],
    ["learn-free", DATA.learn.free, "No free resources yet"]
  ];

  sections.forEach(([id, arr, msg])=>{
    document.getElementById(id).innerHTML = arr.length
      ? arr.map(App.learnCardHTML).join("")
      : App.emptyState(msg, "Recommended content will appear here as it becomes available.");
  });
});
