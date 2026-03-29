const TRACKER_STORAGE_KEY = 'planner.tracker.v2';

const DEFAULT_HABITS = ['Work out', 'Journal', 'Read', 'Pray', 'Hydrate'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const trackerState = {
  viewDate: new Date(),
  habits: [...DEFAULT_HABITS],
  dailyChecks: {},
  dailyCustomItems: {},
  ui: {
    filter: 'all',
    reverseSort: false,
    compact: false
  },
  agenda: {},
  weekOffset: 0
};

function trackerUid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function keyForDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function saveTrackerState() {
  localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify({
    habits: trackerState.habits,
    dailyChecks: trackerState.dailyChecks,
    dailyCustomItems: trackerState.dailyCustomItems,
    agenda: trackerState.agenda,
    weekOffset: trackerState.weekOffset
  }));
}

function loadTrackerState() {
  const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    trackerState.habits = Array.isArray(parsed.habits) && parsed.habits.length ? parsed.habits : [...DEFAULT_HABITS];
    trackerState.dailyChecks = parsed.dailyChecks && typeof parsed.dailyChecks === 'object' ? parsed.dailyChecks : {};
    trackerState.dailyCustomItems = parsed.dailyCustomItems && typeof parsed.dailyCustomItems === 'object' ? parsed.dailyCustomItems : {};
    trackerState.agenda = parsed.agenda && typeof parsed.agenda === 'object' ? parsed.agenda : {};
    trackerState.weekOffset = Number.isInteger(parsed.weekOffset) ? parsed.weekOffset : 0;
  } catch {
    // ignore and use defaults
  }
}

function monthTitle(date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function startOfMonthGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return start;
}

function getMonthDays(date) {
  const start = startOfMonthGrid(date);
  const days = [];

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    days.push(current);
  }

  return days;
}

function getChecksForDate(dateKey) {
  if (!trackerState.dailyChecks[dateKey]) {
    trackerState.dailyChecks[dateKey] = {};
  }
  return trackerState.dailyChecks[dateKey];
}

function getCustomItemsForDate(dateKey) {
  if (!trackerState.dailyCustomItems[dateKey]) {
    trackerState.dailyCustomItems[dateKey] = [];
  }
  return trackerState.dailyCustomItems[dateKey];
}

function renderNoDateCount() {
  const noDateEl = document.getElementById('noDateCount');
  if (!noDateEl) return;

  const todayKey = keyForDate(new Date());
  const checks = getChecksForDate(todayKey);
  const completed = trackerState.habits.filter((habit) => checks[habit]).length;
  const pending = Math.max(0, trackerState.habits.length - completed);
  noDateEl.textContent = `No date (${pending})`;
}

function habitLabelShort(text, compact = false) {
  if (!compact) return text;
  if (text.length <= 6) return text;
  return `${text.slice(0, 4)}...`;
}

function renderCalendar() {
  const monthEl = document.getElementById('calendarMonth');
  const gridEl = document.getElementById('habitCalendarGrid');
  if (!monthEl || !gridEl) return;

  monthEl.textContent = monthTitle(trackerState.viewDate);

  const month = trackerState.viewDate.getMonth();
  const today = new Date();
  const todayKey = keyForDate(today);
  const dates = getMonthDays(trackerState.viewDate);

  const headers = DAY_NAMES.map((name) => `<div class="day-header">${name}</div>`).join('');

  const dayCellList = [];

  dates.forEach((date) => {
    const dateKey = keyForDate(date);
    const checks = getChecksForDate(dateKey);
    const customItems = getCustomItemsForDate(dateKey);
    const isOutside = date.getMonth() !== month;
    const isToday = dateKey === todayKey;

    let habitRows = trackerState.habits.map((habit) => {
      const checked = Boolean(checks[habit]);
      if (trackerState.ui.filter === 'completed' && !checked) return '';
      if (trackerState.ui.filter === 'pending' && checked) return '';

      return `
        <label class="habit-row">
          <input type="checkbox" data-date="${dateKey}" data-habit="${habit.replace(/"/g, '&quot;')}" ${checked ? 'checked' : ''} />
          <span class="habit-text">${habitLabelShort(habit, trackerState.ui.compact)}</span>
        </label>
      `;
    }).join('');

    const customRows = customItems.map((item) => {
      const checked = Boolean(item.done);
      if (trackerState.ui.filter === 'completed' && !checked) return '';
      if (trackerState.ui.filter === 'pending' && checked) return '';

      return `
        <div class="habit-row is-custom">
          <label class="habit-main">
            <input type="checkbox" data-date="${dateKey}" data-custom-id="${item.id}" ${checked ? 'checked' : ''} />
            <span class="habit-text">${habitLabelShort(item.text, trackerState.ui.compact)}</span>
          </label>
          <span class="habit-row-actions">
            <button type="button" class="habit-row-btn" data-custom-action="edit" data-date="${dateKey}" data-custom-id="${item.id}" title="Edit">✎</button>
            <button type="button" class="habit-row-btn" data-custom-action="delete" data-date="${dateKey}" data-custom-id="${item.id}" title="Delete">✕</button>
          </span>
        </div>
      `;
    }).join('');

    habitRows = `${habitRows}${customRows}`;

    const cellClass = `day-cell${isOutside ? ' is-outside' : ''}${isToday ? ' is-today' : ''}`;

    dayCellList.push(`
      <div class="${cellClass}">
        <div class="day-num">${date.getDate()}</div>
        <div class="day-habit-card">
          <div class="day-title">Daily habits</div>
          <div class="habits">${habitRows}</div>
          <div class="habit-actions">
            <button type="button" class="day-add-btn" data-add-day-item="${dateKey}" title="Add item">+</button>
          </div>
        </div>
      </div>
    `);
  });

  const orderedCells = trackerState.ui.reverseSort ? [...dayCellList].reverse() : dayCellList;
  gridEl.innerHTML = `${headers}${orderedCells.join('')}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekKey(date) {
  return keyForDate(startOfWeek(date));
}

function ensureAgendaWeek(weekKeyValue) {
  if (!trackerState.agenda[weekKeyValue]) {
    trackerState.agenda[weekKeyValue] = {};
    WEEK_DAY_NAMES.forEach((dayName) => {
      trackerState.agenda[weekKeyValue][dayName] = [
        { id: trackerUid(), text: 'To-do', done: false },
        { id: trackerUid(), text: 'To-do', done: false }
      ];
    });
  }
  return trackerState.agenda[weekKeyValue];
}

function activeWeekDate() {
  const base = startOfWeek(new Date());
  base.setDate(base.getDate() + (trackerState.weekOffset * 7));
  return base;
}

function renderWeeklyAgenda() {
  const cards = Array.from(document.querySelectorAll('.agenda-grid .day-card'));
  if (!cards.length) return;

  const weekStart = activeWeekDate();
  const currentWeekKey = weekKey(weekStart);
  const weekData = ensureAgendaWeek(currentWeekKey);

  cards.forEach((card, index) => {
    const dayName = WEEK_DAY_NAMES[index];
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + index);

    const titleEl = card.querySelector('h3');
    const listEl = card.querySelector('.day-todos');
    const addBtn = card.querySelector('.add-btn-sm');
    if (!titleEl || !listEl || !addBtn) return;

    card.dataset.dayName = dayName;
    titleEl.textContent = `${dayName} • ${dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

    const items = weekData[dayName] || [];
    listEl.innerHTML = items.map((item) => `
      <li>
        <input type="checkbox" data-agenda-action="toggle" data-day="${dayName}" data-id="${item.id}" ${item.done ? 'checked' : ''} />
        <span>${item.text}</span>
        <span class="todo-actions">
          <button type="button" class="todo-action-btn" data-agenda-action="edit" data-day="${dayName}" data-id="${item.id}">✎</button>
          <button type="button" class="todo-action-btn" data-agenda-action="delete" data-day="${dayName}" data-id="${item.id}">✕</button>
        </span>
      </li>
    `).join('');

    addBtn.dataset.dayName = dayName;
    addBtn.textContent = '💗 add to-do';
  });

  saveTrackerState();
}

function applyCalendarActions(action) {
  if (action === 'filter') {
    const sequence = ['all', 'pending', 'completed'];
    const currentIndex = sequence.indexOf(trackerState.ui.filter);
    trackerState.ui.filter = sequence[(currentIndex + 1) % sequence.length];
  }

  if (action === 'sort') {
    trackerState.ui.reverseSort = !trackerState.ui.reverseSort;
  }

  if (action === 'focus') {
    trackerState.ui.compact = !trackerState.ui.compact;
  }

  if (action === 'search') {
    const dayValue = window.prompt('Go to day number (1-31)');
    if (!dayValue) return;

    const dayNum = Number(dayValue);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) return;

    trackerState.viewDate = new Date(trackerState.viewDate.getFullYear(), trackerState.viewDate.getMonth(), dayNum);
  }

  if (action === 'expand') {
    trackerState.viewDate = new Date();
  }

  if (action === 'reset') {
    const confirmed = window.confirm('Reset all checks and custom items for this month?');
    if (!confirmed) return;

    const y = trackerState.viewDate.getFullYear();
    const m = trackerState.viewDate.getMonth();
    Object.keys(trackerState.dailyChecks).forEach((dateKey) => {
      const d = new Date(dateKey);
      if (d.getFullYear() === y && d.getMonth() === m) {
        delete trackerState.dailyChecks[dateKey];
      }
    });
    Object.keys(trackerState.dailyCustomItems).forEach((dateKey) => {
      const d = new Date(dateKey);
      if (d.getFullYear() === y && d.getMonth() === m) {
        delete trackerState.dailyCustomItems[dateKey];
      }
    });
  }

  renderCalendar();
  renderNoDateCount();
  saveTrackerState();
}

function bindCalendarEvents() {
  const calendarGrid = document.getElementById('habitCalendarGrid');
  const controlWrap = document.getElementById('trackerControls');
  const addHabitBtn = document.getElementById('trackerNewBtn');
  const overviewBtn = document.getElementById('trackerOverviewBtn');
  const prevBtn = document.getElementById('calPrevBtn');
  const nextBtn = document.getElementById('calNextBtn');
  const todayBtn = document.getElementById('calTodayBtn');

  if (calendarGrid) {
    calendarGrid.addEventListener('change', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox') return;

      const dateKey = input.dataset.date;
      if (!dateKey) return;

      if (input.dataset.habit) {
        const checks = getChecksForDate(dateKey);
        checks[input.dataset.habit] = input.checked;
      }

      if (input.dataset.customId) {
        const list = getCustomItemsForDate(dateKey);
        const found = list.find((item) => item.id === input.dataset.customId);
        if (found) found.done = input.checked;
      }

      renderNoDateCount();
      saveTrackerState();
    });

    calendarGrid.addEventListener('click', (event) => {
      const customActionBtn = event.target.closest('[data-custom-action]');
      if (customActionBtn) {
        const action = customActionBtn.dataset.customAction;
        const dateKey = customActionBtn.dataset.date;
        const customId = customActionBtn.dataset.customId;
        if (!action || !dateKey || !customId) return;

        const items = getCustomItemsForDate(dateKey);
        const item = items.find((entry) => entry.id === customId);
        if (!item) return;

        if (action === 'delete') {
          trackerState.dailyCustomItems[dateKey] = items.filter((entry) => entry.id !== customId);
        }

        if (action === 'edit') {
          const nextText = window.prompt('Edit custom item', item.text);
          if (nextText && nextText.trim()) {
            item.text = nextText.trim();
          }
        }

        renderCalendar();
        saveTrackerState();
        return;
      }

      const button = event.target.closest('.day-add-btn');
      if (!button) return;

      const dateKey = button.dataset.addDayItem;
      if (!dateKey) return;

      const text = window.prompt('Add custom habit/task for this day');
      if (!text || !text.trim()) return;

      const items = getCustomItemsForDate(dateKey);
      items.push({ id: trackerUid(), text: text.trim(), done: false });
      renderCalendar();
      saveTrackerState();
    });
  }

  if (controlWrap) {
    controlWrap.addEventListener('click', (event) => {
      const btn = event.target.closest('.icon-btn');
      if (!btn) return;

      applyCalendarActions(btn.dataset.action);

      controlWrap.querySelectorAll('.icon-btn').forEach((button) => {
        button.classList.toggle('is-active', button === btn && ['filter', 'sort', 'focus'].includes(btn.dataset.action));
      });
    });
  }

  if (addHabitBtn) {
    addHabitBtn.addEventListener('click', () => {
      const text = window.prompt('New default habit');
      if (!text || !text.trim()) return;

      trackerState.habits.push(text.trim());
      renderCalendar();
      saveTrackerState();
      renderNoDateCount();
    });
  }

  if (overviewBtn) {
    overviewBtn.addEventListener('click', () => {
      const action = window.prompt('Type: edit / delete');
      if (!action) return;

      if (action.toLowerCase() === 'edit') {
        const from = window.prompt('Current habit name');
        if (!from) return;
        const index = trackerState.habits.findIndex((item) => item.toLowerCase() === from.toLowerCase());
        if (index === -1) return;

        const next = window.prompt('New habit name', trackerState.habits[index]);
        if (!next || !next.trim()) return;

        const previousName = trackerState.habits[index];
        trackerState.habits[index] = next.trim();

        Object.keys(trackerState.dailyChecks).forEach((dateKey) => {
          if (Object.prototype.hasOwnProperty.call(trackerState.dailyChecks[dateKey], previousName)) {
            trackerState.dailyChecks[dateKey][next.trim()] = trackerState.dailyChecks[dateKey][previousName];
            delete trackerState.dailyChecks[dateKey][previousName];
          }
        });
      }

      if (action.toLowerCase() === 'delete') {
        const target = window.prompt('Habit name to delete');
        if (!target) return;
        const index = trackerState.habits.findIndex((item) => item.toLowerCase() === target.toLowerCase());
        if (index === -1) return;

        const [removed] = trackerState.habits.splice(index, 1);
        Object.keys(trackerState.dailyChecks).forEach((dateKey) => {
          delete trackerState.dailyChecks[dateKey][removed];
        });
      }

      renderCalendar();
      saveTrackerState();
      renderNoDateCount();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      trackerState.viewDate = new Date(trackerState.viewDate.getFullYear(), trackerState.viewDate.getMonth() - 1, 1);
      renderCalendar();
      renderNoDateCount();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      trackerState.viewDate = new Date(trackerState.viewDate.getFullYear(), trackerState.viewDate.getMonth() + 1, 1);
      renderCalendar();
      renderNoDateCount();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      trackerState.viewDate = new Date();
      renderCalendar();
      renderNoDateCount();
    });
  }
}

function bindAgendaEvents() {
  const agendaGrid = document.querySelector('.agenda-grid');
  const prevBtn = document.getElementById('weekPrevBtn');
  const nextBtn = document.getElementById('weekNextBtn');
  const todayBtn = document.getElementById('weekTodayBtn');

  if (agendaGrid) {
    agendaGrid.addEventListener('click', (event) => {
      const addButton = event.target.closest('.day-card .add-btn-sm');
      if (addButton) {
        const dayName = addButton.dataset.dayName;
        if (!dayName) return;

        const text = window.prompt(`Add task for ${dayName}`);
        if (!text || !text.trim()) return;

        const weekData = ensureAgendaWeek(weekKey(activeWeekDate()));
        weekData[dayName].push({ id: trackerUid(), text: text.trim(), done: false });
        renderWeeklyAgenda();
        return;
      }

      const actionButton = event.target.closest('[data-agenda-action]');
      if (!actionButton) return;

      const dayName = actionButton.dataset.day;
      const id = actionButton.dataset.id;
      const action = actionButton.dataset.agendaAction;
      if (!dayName || !id || !action) return;

      const weekData = ensureAgendaWeek(weekKey(activeWeekDate()));
      const list = weekData[dayName] || [];
      const item = list.find((entry) => entry.id === id);
      if (!item) return;

      if (action === 'delete') {
        weekData[dayName] = list.filter((entry) => entry.id !== id);
      }

      if (action === 'edit') {
        const text = window.prompt('Edit to-do', item.text);
        if (text && text.trim()) {
          item.text = text.trim();
        }
      }

      if (action === 'toggle') {
        item.done = !item.done;
      }

      renderWeeklyAgenda();
    });

    agendaGrid.addEventListener('change', (event) => {
      const checkbox = event.target.closest('input[data-agenda-action="toggle"]');
      if (!checkbox) return;

      const dayName = checkbox.dataset.day;
      const id = checkbox.dataset.id;
      const weekData = ensureAgendaWeek(weekKey(activeWeekDate()));
      const list = weekData[dayName] || [];
      const item = list.find((entry) => entry.id === id);
      if (!item) return;

      item.done = checkbox.checked;
      saveTrackerState();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      trackerState.weekOffset -= 1;
      renderWeeklyAgenda();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      trackerState.weekOffset += 1;
      renderWeeklyAgenda();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      trackerState.weekOffset = 0;
      renderWeeklyAgenda();
    });
  }
}

function initTrackerCalendar() {
  loadTrackerState();
  trackerState.viewDate = new Date();

  renderCalendar();
  renderNoDateCount();
  renderWeeklyAgenda();

  bindCalendarEvents();
  bindAgendaEvents();
}

initTrackerCalendar();
