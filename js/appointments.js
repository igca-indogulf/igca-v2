/* ==========================================================================
   IGCA — Appointments Page Logic
   ========================================================================== */

document.addEventListener("DOMContentLoaded", ()=>{
  App.mountShell("appointments.html");

  function apptCardHTML(a, status){
    const badge = status==="upcoming" ? '<span class="badge badge-success">Confirmed</span>'
                : status==="pending" ? '<span class="badge badge-warning">Pending</span>'
                : '<span class="badge badge-neutral">Completed</span>';
    return `
    <div class="appt-card reveal">
      <div class="appt-date"><div class="day">${a.day}</div><div class="mon">${a.mon}</div></div>
      ${App.avatarHTML(a.name,"avatar-sm")}
      <div style="flex:1;">
        <div style="font-weight:600;font-size:14.5px;">${a.name}</div>
        <div style="font-size:13px;color:var(--text-secondary);">${a.title} · ${a.type}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:13.5px;font-weight:600;color:var(--primary-dark);">${a.time}</div>
        <div style="margin-top:6px;">${badge}</div>
      </div>
    </div>`;
  }

  document.getElementById("pane-upcoming").innerHTML = DATA.appointments.upcoming.length
    ? DATA.appointments.upcoming.map(a=>apptCardHTML(a,"upcoming")).join("")
    : App.emptyState("No upcoming meetings", "Confirmed meetings will show up here.");
  document.getElementById("pane-pending").innerHTML = DATA.appointments.pending.length
    ? DATA.appointments.pending.map(a=>apptCardHTML(a,"pending")).join("")
    : App.emptyState("No pending requests", "Meeting requests awaiting confirmation will show up here.");
  document.getElementById("pane-completed").innerHTML = DATA.appointments.completed.length
    ? DATA.appointments.completed.map(a=>apptCardHTML(a,"completed")).join("")
    : App.emptyState("No past meetings", "Completed meetings will show up here.");

  const panes = { upcoming:"pane-upcoming", pending:"pane-pending", completed:"pane-completed" };
  document.querySelectorAll(".tab").forEach(tab=>{
    tab.addEventListener("click", ()=>{
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      Object.values(panes).forEach(id=> document.getElementById(id).style.display = "none");
      document.getElementById(panes[tab.dataset.tab]).style.display = "flex";
    });
  });

  const modal = document.getElementById("request-modal");
  document.getElementById("open-request").addEventListener("click", ()=> modal.style.display = "flex");
  document.getElementById("close-modal").addEventListener("click", ()=> modal.style.display = "none");
  document.getElementById("submit-request").addEventListener("click", ()=>{
    modal.style.display = "none";
    alert("Meeting request sent.");
  });
  modal.addEventListener("click", e=>{ if(e.target === modal) modal.style.display = "none"; });
});
