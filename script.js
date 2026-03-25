const STORAGE_KEY = "myplanner.v1";

let state = {
  tasks: [],
  goals: [],
  filter: "all"
};

const taskForm = document.getElementById("taskForm");
const goalForm = document.getElementById("goalForm");
const taskTitle = document.getElementById("taskTitle");
const taskDueDate = document.getElementById("taskDueDate");
const taskPriority = document.getElementById("taskPriority");
const goalTitle = document.getElementById("goalTitle");
const taskError = document.getElementById("taskError");
const goalError = document.getElementById("goalError");
const taskList = document.getElementById("taskList");
const goalList = document.getElementById("goalList");
const completedList = document.getElementById("completedList");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const filterButtons = document.querySelectorAll(".filter");

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    state.goals = Array.isArray(parsed.goals) ? parsed.goals : [];
    state.filter = ["all", "pending", "completed"].includes(parsed.filter) ? parsed.filter : "all";
  } catch {
    state = { tasks: [], goals: [], filter: "all" };
  }
}

function safeText(value) {
  return String(value || "").replace(/[&<>\"']/g, (ch) => {
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    if (ch === '\"') return "&quot;";
    return "&#39;";
  });
}

function byFilter(task) {
  if (state.filter === "completed") return task.completed;
  if (state.filter === "pending") return !task.completed;
  return true;
}

function formatDate(value) {
  if (!value) return "No due date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No due date";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function renderTasks() {
  if (!taskList) return;
  const items = state.tasks.filter(byFilter);
  if (!items.length) {
    taskList.innerHTML = '<li class="empty">No tasks here</li>';
    return;
  }

  taskList.innerHTML = items
    .map((task) => {
      const p = task.priority.toLowerCase();
      return `
        <li class="item ${task.completed ? "is-complete" : ""}">
          <div class="row">
            <div>
              <p class="title">${safeText(task.title)}</p>
              <div class="meta">
                <span class="badge ${p}">${safeText(task.priority)}</span>
                <span>${safeText(formatDate(task.dueDate))}</span>
              </div>
            </div>
            <div class="actions">
              <button type="button" data-act="toggle-task" data-id="${task.id}">${task.completed ? "Undo" : "Done"}</button>
              <button type="button" data-act="edit-task" data-id="${task.id}">Edit</button>
              <button type="button" data-act="delete-task" data-id="${task.id}">Delete</button>
            </div>
          </div>
        </li>
      `;
    })
    .join("");
}

function renderGoals() {
  if (!goalList) return;
  if (!state.goals.length) {
    goalList.innerHTML = '<li class="empty">No goals yet</li>';
    return;
  }

  goalList.innerHTML = state.goals
    .map(
      (goal) => `
      <li class="item ${goal.completed ? "is-complete" : ""}">
        <div class="row">
          <p class="title">${safeText(goal.title)}</p>
          <div class="actions">
            <button type="button" data-act="toggle-goal" data-id="${goal.id}">${goal.completed ? "Undo" : "Done"}</button>
            <button type="button" data-act="edit-goal" data-id="${goal.id}">Edit</button>
            <button type="button" data-act="delete-goal" data-id="${goal.id}">Delete</button>
          </div>
        </div>
      </li>
    `
    )
    .join("");
}

function renderCompleted() {
  if (!completedList) return;
  const doneTasks = state.tasks.filter((x) => x.completed).map((x) => `Task: ${x.title}`);
  const doneGoals = state.goals.filter((x) => x.completed).map((x) => `Goal: ${x.title}`);
  const done = [...doneTasks, ...doneGoals];

  if (!done.length) {
    completedList.innerHTML = '<li class="empty">Nothing completed yet</li>';
    return;
  }

  completedList.innerHTML = done.map((text) => `<li class="item is-complete"><p class="title">${safeText(text)}</p></li>`).join("");
}

function renderProgress() {
  if (!progressText || !progressBar) return;
  const total = state.tasks.length;
  const completed = state.tasks.filter((x) => x.completed).length;
  const ratio = total ? Math.round((completed / total) * 100) : 0;
  progressText.textContent = `${ratio}% done`;
  progressBar.style.width = `${ratio}%`;
}

function renderFilters() {
  if (!filterButtons.length) return;
  filterButtons.forEach((btn) => {
    const active = btn.dataset.filter === state.filter;
    btn.classList.toggle("is-active", active);
  });
}

function render() {
  renderTasks();
  renderGoals();
  renderCompleted();
  renderProgress();
  renderFilters();
}

function upsertTask(event) {
  event.preventDefault();
  const title = taskTitle.value.trim();
  if (!title) {
    taskError.textContent = "Task title is required";
    return;
  }

  taskError.textContent = "";
  state.tasks.unshift({
    id: uid(),
    title,
    dueDate: taskDueDate.value,
    priority: taskPriority.value,
    completed: false
  });

  taskForm.reset();
  taskPriority.value = "Medium";
  save();
  render();
}

function upsertGoal(event) {
  event.preventDefault();
  const title = goalTitle.value.trim();
  if (!title) {
    goalError.textContent = "Goal title is required";
    return;
  }

  goalError.textContent = "";
  state.goals.unshift({
    id: uid(),
    title,
    completed: false
  });

  goalForm.reset();
  save();
  render();
}

function onTaskActions(event) {
  const button = event.target.closest("button[data-act]");
  if (!button) return;
  const id = button.dataset.id;
  const act = button.dataset.act;
  const task = state.tasks.find((x) => x.id === id);
  if (!task) return;

  if (act === "toggle-task") {
    task.completed = !task.completed;
  }

  if (act === "delete-task") {
    state.tasks = state.tasks.filter((x) => x.id !== id);
  }

  if (act === "edit-task") {
    const nextTitle = prompt("Edit task title", task.title);
    if (nextTitle === null) return;
    const trimmed = nextTitle.trim();
    if (!trimmed) return;
    task.title = trimmed;
  }

  save();
  render();
}

function onGoalActions(event) {
  const button = event.target.closest("button[data-act]");
  if (!button) return;
  const id = button.dataset.id;
  const act = button.dataset.act;
  const goal = state.goals.find((x) => x.id === id);
  if (!goal) return;

  if (act === "toggle-goal") {
    goal.completed = !goal.completed;
  }

  if (act === "delete-goal") {
    state.goals = state.goals.filter((x) => x.id !== id);
  }

  if (act === "edit-goal") {
    const nextTitle = prompt("Edit goal", goal.title);
    if (nextTitle === null) return;
    const trimmed = nextTitle.trim();
    if (!trimmed) return;
    goal.title = trimmed;
  }

  save();
  render();
}

function onFilterChange(event) {
  const button = event.target.closest(".filter");
  if (!button) return;
  state.filter = button.dataset.filter;
  save();
  render();
}

if (taskForm) taskForm.addEventListener("submit", upsertTask);
if (goalForm) goalForm.addEventListener("submit", upsertGoal);
if (taskList) taskList.addEventListener("click", onTaskActions);
if (goalList) goalList.addEventListener("click", onGoalActions);
const filters = document.querySelector(".filters");
if (filters) filters.addEventListener("click", onFilterChange);

load();
render();
