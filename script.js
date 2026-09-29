/* ---------- Storage ---------- */
const STORAGE_KEY = "todo-app-v1";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, "0");

function defaultState() {
  const lists = ["Personal", "Work", "Study"].map(name => ({ id: uid(), name }));
  return { lists, tasks: [], activeListId: lists[0].id };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.lists) && data.lists.length && Array.isArray(data.tasks)) {
        if (!data.lists.some(l => l.id === data.activeListId)) data.activeListId = data.lists[0].id;
        return data;
      }
    }
  } catch (err) { /* storage unavailable or corrupted: start fresh */ }
  return defaultState();
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) { /* ignore */ }
}

/* ---------- State ---------- */
// state = { lists: [{id, name}], tasks: [{id, listId, text, date, time, done, created}], activeListId }
const state = load();
let filter = "all";      // all | active | completed
let editingId = null;    // id of the task being edited

/* ---------- Elements ---------- */
const $ = id => document.getElementById(id);
const listNav = $("list-nav");
const listTitle = $("list-title");
const listMeta = $("list-meta");
const taskList = $("task-list");
const emptyMsg = $("empty");
const clearBtn = $("clear-btn");
const deleteListBtn = $("delete-list-btn");
const statusEl = $("status");

/* ---------- Helpers ---------- */
function say(message) {
  statusEl.textContent = "";
  setTimeout(() => { statusEl.textContent = message; }, 50);
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function activeList() {
  return state.lists.find(l => l.id === state.activeListId);
}

// A time without a date means "today"
function cleanDue(date, time) {
  if (time && !date) date = todayISO();
  return { date: date || "", time: date ? time || "" : "" };
}

function dueDateTime(task) {
  if (!task.date) return null;
  const [y, m, d] = task.date.split("-").map(Number);
  if (task.time) {
    const [h, min] = task.time.split(":").map(Number);
    return new Date(y, m - 1, d, h, min);
  }
  return new Date(y, m - 1, d, 23, 59, 59);     // no time: due at the end of that day
}

function isOverdue(task) {
  const due = dueDateTime(task);
  return !task.done && due !== null && due < new Date();
}

function formatDue(task) {
  const due = dueDateTime(task);
  if (!due) return "";
  const sameYear = due.getFullYear() === new Date().getFullYear();
  let text = "Due " + due.toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short", year: sameYear ? undefined : "numeric"
  });
  if (task.time) {
    text += ", " + due.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return text;
}

// Open tasks first, earliest due date first, tasks without a date after those
function sortTasks(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const da = dueDateTime(a), db = dueDateTime(b);
  if (da && db) return da - db;
  if (da) return -1;
  if (db) return 1;
  return a.created - b.created;
}

function tasksInActiveList() {
  return state.tasks.filter(t => t.listId === state.activeListId);
}

function visibleTasks() {
  return tasksInActiveList()
    .filter(t => filter === "all" || (filter === "active" ? !t.done : t.done))
    .sort(sortTasks);
}

function makeButton(text, className, label, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = className;
  b.textContent = text;
  if (label) b.setAttribute("aria-label", label);
  b.addEventListener("click", onClick);
  return b;
}

function makeField(type, value, label) {
  const input = document.createElement("input");
  input.type = type;
  input.className = "field";
  input.value = value || "";
  if (label) input.setAttribute("aria-label", label);
  return input;
}

function labelled(text, input) {
  const l = document.createElement("label");
  l.className = "mini-label";
  l.append(text, input);
  return l;
}

/* ---------- Render: lists ---------- */
function renderLists() {
  listNav.innerHTML = "";
  state.lists.forEach(list => {
    const open = state.tasks.filter(t => t.listId === list.id && !t.done).length;
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "list-btn";
    btn.setAttribute("aria-label", `${list.name}, ${open} open tasks`);
    if (list.id === state.activeListId) btn.setAttribute("aria-current", "true");

    const name = document.createElement("span");
    name.className = "list-name";
    name.textContent = list.name;
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = open;

    btn.append(name, count);
    btn.addEventListener("click", () => {
      state.activeListId = list.id;
      editingId = null;
      save();
      render();
    });
    li.appendChild(btn);
    listNav.appendChild(li);
  });
}

function renderHeader() {
  const list = activeList();
  const all = tasksInActiveList();
  const done = all.filter(t => t.done).length;
  listTitle.textContent = list.name;
  listMeta.textContent = `${all.length - done} open, ${done} completed`;
  deleteListBtn.disabled = state.lists.length <= 1;
  clearBtn.disabled = done === 0;
  document.querySelectorAll(".filter").forEach(b => {
    b.setAttribute("aria-pressed", String(b.dataset.filter === filter));
  });
}

/* ---------- Render: tasks ---------- */
function taskRow(task) {
  const li = document.createElement("li");
  li.className = "task" + (task.done ? " done" : "") + (isOverdue(task) ? " overdue" : "");

  const check = document.createElement("input");
  check.type = "checkbox";
  check.className = "check";
  check.checked = task.done;
  check.setAttribute("aria-label", `Mark completed: ${task.text}`);
  check.dataset.taskId = task.id;
  check.addEventListener("change", () => {
    task.done = check.checked;
    save();
    render();
    const again = taskList.querySelector(`[data-task-id="${task.id}"]`);
    if (again) again.focus();          // keep keyboard focus on the task after it moves
    say(task.done ? "Task marked as completed" : "Task marked as active");
  });

  const body = document.createElement("div");
  body.className = "task-body";
  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;
  body.appendChild(text);

  const dueText = formatDue(task);
  if (dueText) {
    const due = document.createElement("span");
    due.className = "due";
    due.textContent = dueText;
    if (isOverdue(task)) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = "Overdue";
      due.appendChild(tag);
    }
    body.appendChild(due);
  }

  const actions = document.createElement("div");
  actions.className = "task-actions";
  const editBtn = makeButton("Edit", "btn-small", `Edit task: ${task.text}`, () => {
    editingId = task.id;
    renderTasks();
    const input = taskList.querySelector(".edit-form .field");
    if (input) input.focus();
  });
  editBtn.dataset.editFor = task.id;
  const delBtn = makeButton("Delete", "btn-small btn-danger", `Delete task: ${task.text}`, () => {
    state.tasks = state.tasks.filter(t => t.id !== task.id);
    save();
    render();
    say("Task deleted");
  });
  actions.append(editBtn, delBtn);

  li.append(check, body, actions);
  return li;
}

function editRow(task) {
  const li = document.createElement("li");
  li.className = "task editing";

  const form = document.createElement("form");
  form.className = "edit-form";
  const text = makeField("text", task.text, "Task text");
  text.maxLength = 200;
  const date = makeField("date", task.date);
  const time = makeField("time", task.time);

  const buttons = document.createElement("div");
  buttons.className = "edit-buttons";
  const saveBtn = makeButton("Save", "btn btn-primary", "", () => {});
  saveBtn.type = "submit";
  const cancelBtn = makeButton("Cancel", "btn btn-secondary", "", () => stopEditing(task.id));
  buttons.append(saveBtn, cancelBtn);

  const row = document.createElement("div");
  row.className = "edit-row";
  row.append(labelled("Due date", date), labelled("Due time", time), buttons);

  form.append(text, row);
  form.addEventListener("submit", e => {
    e.preventDefault();
    const newText = text.value.trim();
    if (!newText) { text.focus(); say("Task text cannot be empty"); return; }
    const due = cleanDue(date.value, time.value);
    task.text = newText;
    task.date = due.date;
    task.time = due.time;
    save();
    stopEditing(task.id);
    say("Task updated");
  });
  form.addEventListener("keydown", e => {
    if (e.key === "Escape") stopEditing(task.id);
  });

  li.appendChild(form);
  return li;
}

function stopEditing(taskId) {
  editingId = null;
  render();
  const btn = taskList.querySelector(`[data-edit-for="${taskId}"]`);
  if (btn) btn.focus();
}

function renderTasks() {
  taskList.innerHTML = "";
  const items = visibleTasks();
  items.forEach(t => taskList.appendChild(t.id === editingId ? editRow(t) : taskRow(t)));

  const total = tasksInActiveList().length;
  emptyMsg.hidden = items.length > 0;
  emptyMsg.textContent =
    total === 0 ? "No tasks in this list yet. Add your first task above." :
    filter === "active" ? "Nothing left to do here. Nice work!" :
    "No completed tasks yet.";
}

function render() {
  renderLists();
  renderHeader();
  renderTasks();
}

/* ---------- Events: tasks ---------- */
$("task-form").addEventListener("submit", e => {
  e.preventDefault();
  const input = $("task-input");
  const text = input.value.trim();
  if (!text) { input.focus(); say("Enter a task first"); return; }

  const due = cleanDue($("task-date").value, $("task-time").value);
  state.tasks.push({
    id: uid(),
    listId: state.activeListId,
    text,
    date: due.date,
    time: due.time,
    done: false,
    created: Date.now()
  });
  e.target.reset();
  input.focus();
  save();
  render();
  say("Task added");
});

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    editingId = null;
    render();
  });
});

clearBtn.addEventListener("click", () => {
  const before = state.tasks.length;
  state.tasks = state.tasks.filter(t => !(t.listId === state.activeListId && t.done));
  save();
  render();
  say(`${before - state.tasks.length} completed tasks removed`);
});

/* ---------- Events: lists ---------- */
$("list-form").addEventListener("submit", e => {
  e.preventDefault();
  const input = $("list-input");
  const name = input.value.trim();
  if (!name) { input.focus(); return; }
  const list = { id: uid(), name };
  state.lists.push(list);
  state.activeListId = list.id;
  editingId = null;
  input.value = "";
  save();
  render();
  say(`List ${name} created`);
});

$("rename-btn").addEventListener("click", () => {
  const list = activeList();
  const name = prompt("Rename list", list.name);
  if (name && name.trim()) {
    list.name = name.trim().slice(0, 30);
    save();
    render();
  }
});

deleteListBtn.addEventListener("click", () => {
  if (state.lists.length <= 1) return;
  const list = activeList();
  const count = tasksInActiveList().length;
  const ok = confirm(`Delete the list "${list.name}" and its ${count} task${count === 1 ? "" : "s"}?`);
  if (!ok) return;
  state.tasks = state.tasks.filter(t => t.listId !== list.id);
  state.lists = state.lists.filter(l => l.id !== list.id);
  state.activeListId = state.lists[0].id;
  editingId = null;
  save();
  render();
  say("List deleted");
});

/* ---------- Keep "Overdue" labels fresh ---------- */
setInterval(() => {
  // Do not redraw while the user is working inside the task list
  if (!taskList.contains(document.activeElement)) renderTasks();
}, 60000);

render();
