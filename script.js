const STORAGE_KEY = "myplanner.v1";

let state = {
  tasks: [],
  goals: [],
  filter: "all",
  coverImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1920&q=80"
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
    state.coverImage = parsed.coverImage || "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1920&q=80";
  } catch {
    state = { tasks: [], goals: [], filter: "all", coverImage: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1920&q=80" };
  }
  // Apply the saved cover image
  applyCoverImage();
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

// Background Image Modal Functionality
const modal = document.getElementById('bgImageModal');
const changeBtn = document.querySelector('.cover-actions button:first-child');
const closeBtn = document.getElementById('closeModal');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const unsplashSearch = document.getElementById('unsplashSearch');
const searchBtn = document.getElementById('searchBtn');
const unsplashGrid = document.getElementById('unsplashGrid');

function applyCoverImage() {
  const coverElement = document.querySelector('.cover');
  if (coverElement && state.coverImage) {
    coverElement.style.backgroundImage = `url('${state.coverImage}')`;
  }
}

function openModal() {
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

window.setCoverImage = function (imageUrl) {
  state.coverImage = imageUrl;
  save();
  applyCoverImage();
  closeModal();
};

// Tab switching
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;

    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(`${targetTab}-tab`).classList.add('active');
  });
});

// File upload
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');

  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('image/')) {
    handleImageFile(files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleImageFile(e.target.files[0]);
  }
});

function handleImageFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    alert('File size must be less than 10MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    setCoverImage(e.target.result);
  };
  reader.readAsDataURL(file);
}

// Unsplash integration
async function searchUnsplash(query) {
  if (!query.trim()) return;

  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&client_id=YOUR_UNSPLASH_ACCESS_KEY`);
    if (!response.ok) {
      // Fallback to demo images if API fails
      showDemoImages();
      return;
    }

    const data = await response.json();
    displayUnsplashImages(data.results);
  } catch (error) {
    console.error('Unsplash API error:', error);
    showDemoImages();
  }
}

function showDemoImages() {
  const demoImages = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1516979187457-635ecca20e38?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'
  ];

  displayUnsplashImages(demoImages.map(url => ({ urls: { regular: url } })));
}

function displayUnsplashImages(images) {
  unsplashGrid.innerHTML = images.map(photo => `
    <div class="unsplash-item" onclick="setCoverImage('${photo.urls.regular}')">
      <img src="${photo.urls.regular}" alt="Unsplash image" loading="lazy">
    </div>
  `).join('');
}

searchBtn.addEventListener('click', () => {
  searchUnsplash(unsplashSearch.value);
});

unsplashSearch.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchUnsplash(unsplashSearch.value);
  }
});

// Modal event listeners
if (changeBtn) changeBtn.addEventListener('click', openModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Spotify functionality
function initSpotifyPlayer() {
  const playBtn = document.getElementById('spotifyPlay');
  const prevBtn = document.getElementById('spotifyPrev');
  const nextBtn = document.getElementById('spotifyNext');
  const trackList = document.querySelector('.track-list');

  if (playBtn && prevBtn && nextBtn && trackList) {
    let isPlaying = false;
    let currentTrack = 0;
    const tracks = Array.from(trackList.querySelectorAll('li'));

    // Play/Pause functionality
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playBtn.textContent = isPlaying ? '⏸' : '▶';

      // Highlight current track
      if (isPlaying && tracks.length > 0) {
        tracks.forEach(track => track.style.background = 'transparent');
        tracks[currentTrack].style.background = 'rgba(215, 122, 156, 0.1)';
      } else {
        tracks.forEach(track => track.style.background = 'transparent');
      }
    });

    // Previous track
    prevBtn.addEventListener('click', () => {
      currentTrack = Math.max(0, currentTrack - 1);
      updateTrackHighlight();
    });

    // Next track
    nextBtn.addEventListener('click', () => {
      currentTrack = Math.min(tracks.length - 1, currentTrack + 1);
      updateTrackHighlight();
    });

    function updateTrackHighlight() {
      tracks.forEach((track, index) => {
        track.style.background = index === currentTrack && isPlaying ?
          'rgba(215, 122, 156, 0.1)' : 'transparent';
      });
    }

    // Add click functionality to tracks
    tracks.forEach((track, index) => {
      track.style.cursor = 'pointer';
      track.addEventListener('click', () => {
        currentTrack = index;
        isPlaying = true;
        playBtn.textContent = '⏸';
        updateTrackHighlight();
      });
    });
  }
}

// Initialize Spotify when DOM is loaded
document.addEventListener('DOMContentLoaded', initSpotifyPlayer);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.style.display === 'block') {
    closeModal();
  }
});

load();
render();
