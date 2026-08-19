/* ==========================================================================
   IGCA — AI Research Page Logic (mock responses, no real model call)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async ()=>{
  App.mountShell("ai-research.html");
  let myName = "You";
  try{ const p = await IGCA_API.profile(); if(p && p.full_name) myName = p.full_name; }catch(e){}

  const responses = {
    "Give me an overview of the healthcare industry.":
      "Healthcare spans providers, payers, diagnostics and med-tech. In private markets, investors are focused on diagnostics networks, specialty care chains and healthtech platforms, with growth capital concentrated in regional expansion and digital-first care models. Related professionals on IGCA include advisors and consultants tagged under Healthcare.",
    "Explain how private equity works.":
      "Private equity firms raise capital from institutional and family-office investors, then acquire or invest in companies with the goal of improving performance before an eventual exit — typically a sale or public listing. Funds are usually structured with a 10-year horizon, an investment period, and a management fee plus a share of profits (carried interest).",
    "Find professionals working in venture capital.":
      "Several venture capital professionals are active on IGCA, including principals focused on seed and consumer-tech investing. You can view their profiles, mutual connections and areas of focus directly from the Discover page.",
    "What should I understand before evaluating a real estate business?":
      "Key factors include asset quality and location, occupancy and lease structure, developer track record, regulatory approvals, and exit liquidity. For institutional-grade deals, also review title clarity, debt structure and the sponsor's prior fund performance."
  };

  const thread = document.getElementById("ai-thread");
  const input = document.getElementById("ai-input");

  function ask(question){
    if(!question || !question.trim()) return;
    const userBlock = document.createElement("div");
    userBlock.className = "ai-response reveal";
    userBlock.innerHTML = `<div class="who">${App.avatarHTML(myName,"avatar-sm")} You</div><p>${question}</p>`;
    thread.appendChild(userBlock);

    const loading = document.createElement("div");
    loading.className = "ai-response reveal";
    loading.innerHTML = `<div class="who"><div class="ai-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="7" width="16" height="12" rx="2"/><path d="M9 3v4M15 3v4"/></svg></div>IGCA AI</div>
      <div class="typing-dots"><span></span><span></span><span></span></div>`;
    thread.appendChild(loading);
    loading.scrollIntoView({behavior:"smooth", block:"end"});

    setTimeout(()=>{
      const answer = responses[question] || "Here's a general perspective based on your network and industry data: this topic connects to several verified professionals and firms on IGCA — try refining your question or exploring the Discover page for relevant experts.";
      loading.innerHTML = `<div class="who"><div class="ai-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="7" width="16" height="12" rx="2"/><path d="M9 3v4M15 3v4"/></svg></div>IGCA AI</div><p style="font-size:14.5px;line-height:1.7;">${answer}</p>`;
    }, 900);

    input.value = "";
  }

  document.getElementById("ai-submit").addEventListener("click", ()=> ask(input.value));
  input.addEventListener("keydown", e=>{ if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); ask(input.value); } });

  document.querySelectorAll(".prompt-chip").forEach(chip=>{
    chip.addEventListener("click", ()=> ask(chip.dataset.q));
  });
});
