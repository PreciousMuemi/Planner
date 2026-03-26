const MONTH_GOALS = {
  January: [
    "Reset but not delusional",
    "Fix sleep schedule (before 1am, no excuses)",
    "Track every shilling spent (face your finances)",
    "Start 1 dev project (even ugly, just start)"
  ],
  February: [
    "Skill stacking",
    "Code 4–5 days/week minimum",
    "Build 1 feature that actually works (not tutorials)",
    "Apply to 5 real opportunities (internships/gigs)"
  ],
  March: [
    "Execution mode",
    "Finish and deploy 1 full project (like this planner 👀)",
    "Improve your GitHub (clean repos, real commits)",
    "Control eczema triggers (food + hygiene consistency)"
  ],
  April: [
    "Money focus",
    "Try 1 income stream (freelance / small gigs)",
    "Learn how to sell your skills (not just code)",
    "Save at least something (even small — discipline matters)"
  ],
  May: [
    "Academic comeback",
    "Study intentionally (not last-minute panic)",
    "Revise weak units (be honest where you’re dumb)",
    "Ask for help (lecturers / friends — stop struggling alone)"
  ],
  June: [
    "Health + balance",
    "Fix your diet around eczema (no guessing)",
    "Walk / move your body 3x a week",
    "Drink water like your skin depends on it (it does)"
  ],
  July: [
    "Build in public energy",
    "Post your work online (LinkedIn/GitHub)",
    "Network with 3 people in tech",
    "Improve 1 existing project (don’t keep starting new ones)"
  ],
  August: [
    "Career positioning",
    "Polish your CV + portfolio",
    "Apply consistently (10+ applications)",
    "Practice interviews (you’re not winging it anymore)"
  ],
  September: [
    "Level up technically",
    "Learn 1 advanced concept (APIs, auth, web3, etc.)",
    "Build something slightly uncomfortable (push yourself)",
    "Reduce distractions (you waste more time than you admit)"
  ],
  October: [
    "Consistency check",
    "Show up daily (even 1–2 hours matters)",
    "Track your habits (stop lying to yourself)",
    "Finish what you start (no abandoned projects)"
  ],
  November: [
    "Results season",
    "Pass exams strongly (no survival mentality)",
    "Ship another solid project",
    "Reflect: what actually worked this year?"
  ],
  December: [
    "Audit + soft life",
    "Review your growth (skills, money, discipline)",
    "Plan next year properly (not vibes)",
    "Rest without guilt (you earned it… hopefully)"
  ]
};

document.querySelectorAll('.month-play').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const month = btn.dataset.month;
    const monthItem = btn.closest('.month-item');
    const dropdown = monthItem.querySelector('.month-goals-dropdown');
    const isOpen = dropdown.classList.contains('open');
    
    // Close all other dropdowns
    document.querySelectorAll('.month-goals-dropdown.open').forEach(d => {
      if (d !== dropdown) {
        d.classList.remove('open');
      }
    });
    
    // Remove active state from all buttons except this one
    document.querySelectorAll('.month-play.is-active').forEach(b => {
      if (b !== btn) {
        b.classList.remove('is-active');
      }
    });
    
    // Toggle current dropdown
    if (isOpen) {
      dropdown.classList.remove('open');
      btn.classList.remove('is-active');
    } else {
      const goals = MONTH_GOALS[month];
      const goalsHTML = `
        <div class="month-goals-panel">
          <h4>${month}</h4>
          <ul>
            ${goals.map(goal => `<li>${goal}</li>`).join('')}
          </ul>
        </div>
      `;
      dropdown.innerHTML = goalsHTML;
      dropdown.classList.add('open');
      btn.classList.add('is-active');
    }
  });
});
