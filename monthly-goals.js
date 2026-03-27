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
    "Revise weak units (be honest where you're dumb)",
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
    "Improve 1 existing project (don't keep starting new ones)"
  ],
  August: [
    "Career positioning",
    "Polish your CV + portfolio",
    "Apply consistently (10+ applications)",
    "Practice interviews (you're not winging it anymore)"
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

class GoalsManager {
  constructor() {
    this.storageKey = 'monthlyGoalsState';
    this.state = this.loadState();
  }

  buildDefaultState() {
    const defaults = {};
    Object.keys(MONTH_GOALS).forEach((month) => {
      defaults[month] = MONTH_GOALS[month].map((text, index) => ({
        id: `${month}-${index}`,
        text,
        completed: false
      }));
    });
    return defaults;
  }

  normalizeState(rawState) {
    const defaults = this.buildDefaultState();
    const normalized = {};

    Object.keys(defaults).forEach((month) => {
      const rawMonthGoals = Array.isArray(rawState?.[month]) ? rawState[month] : defaults[month];

      normalized[month] = rawMonthGoals
        .map((goal, index) => {
          if (typeof goal === 'string') {
            return {
              id: `${month}-${index}-${Date.now()}`,
              text: goal,
              completed: false
            };
          }

          if (!goal || typeof goal !== 'object') {
            return null;
          }

          const text = String(goal.text || '').trim();
          if (!text) return null;

          return {
            id: goal.id || `${month}-${index}-${Date.now()}`,
            text,
            completed: Boolean(goal.completed)
          };
        })
        .filter(Boolean);
    });

    return normalized;
  }

  loadState() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        const defaults = this.buildDefaultState();
        this.saveState(defaults);
        return defaults;
      }

      const parsed = JSON.parse(stored);
      const normalized = this.normalizeState(parsed);
      this.saveState(normalized);
      return normalized;
    } catch {
      const defaults = this.buildDefaultState();
      this.saveState(defaults);
      return defaults;
    }
  }

  saveState(nextState) {
    localStorage.setItem(this.storageKey, JSON.stringify(nextState));
    this.state = nextState;
  }

  getGoals(month) {
    return this.state[month] || [];
  }

  addGoal(month, text) {
    const cleanText = String(text || '').trim();
    if (!cleanText) return false;

    const nextGoal = {
      id: `${month}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: cleanText,
      completed: false
    };

    this.state[month].push(nextGoal);
    this.saveState(this.state);
    return true;
  }

  toggleGoal(month, goalId) {
    const goal = this.state[month].find((item) => item.id === goalId);
    if (!goal) return false;

    goal.completed = !goal.completed;
    this.saveState(this.state);
    return true;
  }

  updateGoal(month, goalId, text) {
    const cleanText = String(text || '').trim();
    if (!cleanText) return false;

    const goal = this.state[month].find((item) => item.id === goalId);
    if (!goal) return false;

    goal.text = cleanText;
    this.saveState(this.state);
    return true;
  }

  deleteGoal(month, goalId) {
    const currentGoals = this.state[month];
    const index = currentGoals.findIndex((item) => item.id === goalId);
    if (index === -1) return false;

    currentGoals.splice(index, 1);
    this.saveState(this.state);
    return true;
  }
}

const goalsManager = new GoalsManager();

function renderMonthGoals(month, dropdown) {
  const goals = goalsManager.getGoals(month);

  dropdown.innerHTML = `
    <div class="month-goals-panel">
      <h4>▼ ${month}</h4>
      <ul>
        ${goals.length
          ? goals.map((goal) => `
            <li class="goal-item">
              <input
                class="goal-check"
                type="checkbox"
                id="goal-${goal.id}"
                data-goal-id="${goal.id}"
                ${goal.completed ? 'checked' : ''}
              />
              <label class="goal-text ${goal.completed ? 'is-complete' : ''}" for="goal-${goal.id}">${goal.text}</label>
              <span class="goal-actions">
                <button type="button" class="goal-action-btn" data-goal-action="edit" data-goal-id="${goal.id}">✎</button>
                <button type="button" class="goal-action-btn" data-goal-action="delete" data-goal-id="${goal.id}">✕</button>
              </span>
            </li>
          `).join('')
          : '<li class="goal-empty">No goals yet. Add one below.</li>'}
      </ul>
      <form class="goal-add-form" autocomplete="off">
        <input class="goal-add-input" name="goalText" type="text" placeholder="Add a goal..." maxlength="120" required />
        <button class="goal-add-btn" type="submit">Add</button>
      </form>
    </div>
  `;
}

function bindDropdownCrudEvents(month, dropdown) {
  if (dropdown.dataset.boundCrud === 'true') return;
  dropdown.dataset.boundCrud = 'true';

  dropdown.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.goal-check');
    if (!checkbox) return;

    goalsManager.toggleGoal(month, checkbox.dataset.goalId);
    renderMonthGoals(month, dropdown);
  });

  dropdown.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-goal-action]');
    if (!actionButton) return;

    const goalId = actionButton.dataset.goalId;
    const action = actionButton.dataset.goalAction;
    const currentGoal = goalsManager.getGoals(month).find((goal) => goal.id === goalId);

    if (!currentGoal) return;

    if (action === 'delete') {
      goalsManager.deleteGoal(month, goalId);
      renderMonthGoals(month, dropdown);
      return;
    }

    if (action === 'edit') {
      const updated = window.prompt('Edit goal', currentGoal.text);
      if (updated === null) return;

      goalsManager.updateGoal(month, goalId, updated);
      renderMonthGoals(month, dropdown);
    }
  });

  dropdown.addEventListener('submit', (event) => {
    const form = event.target.closest('.goal-add-form');
    if (!form) return;

    event.preventDefault();
    const input = form.querySelector('.goal-add-input');
    if (!input) return;

    const didAdd = goalsManager.addGoal(month, input.value);
    if (!didAdd) return;

    input.value = '';
    renderMonthGoals(month, dropdown);
  });
}

const monthButtons = document.querySelectorAll('.month-play');

monthButtons.forEach((button) => {
  button.textContent = '▸';

  button.addEventListener('click', (event) => {
    event.preventDefault();

    const month = button.dataset.month;
    const monthItem = button.closest('.month-item');
    if (!monthItem) return;

    const dropdown = monthItem.querySelector('.month-goals-dropdown');
    if (!dropdown) return;

    const isAlreadyOpen = dropdown.classList.contains('open');

    document.querySelectorAll('.month-goals-dropdown.open').forEach((openDropdown) => {
      openDropdown.classList.remove('open');
    });

    monthButtons.forEach((btn) => {
      btn.classList.remove('is-active');
      btn.textContent = '▸';
    });

    if (isAlreadyOpen) {
      return;
    }

    bindDropdownCrudEvents(month, dropdown);
    renderMonthGoals(month, dropdown);

    dropdown.classList.add('open');
    button.classList.add('is-active');
    button.textContent = '▾';
  });
});
