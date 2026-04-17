const KEY = "attendance-simple-v1";

const defaultState = {
  user: null,
  location: null,
  classroom: {
    courseName: "MAD9014 - Interactive Media Design",
    instructorName: "Prof. David P.",
    room: "C104",
    latitude: null,
    longitude: null,
    radius: 50,
    windowOpen: false,
    sessionId: null,
    openedAt: null
  },
  checkins: []
};

let state = load();

const $ = (id) => document.getElementById(id);

const ui = {
  authScreen: $("auth-screen"),
  studentScreen: $("student-screen"),
  instructorScreen: $("instructor-screen"),

  authCourseName: $("auth-course-name"),
  authCourseMeta: $("auth-course-meta"),

  signinModal: $("signin-modal"),
  openSigninModal: $("open-signin-modal"),
  closeSigninModal: $("close-signin-modal"),
  githubUsername: $("github-username"),
  signinRole: $("signin-role"),
  githubSigninSubmit: $("github-signin-submit"),
  authMessage: $("auth-message"),

  studentAvatar: $("student-avatar"),
  studentSignout: $("student-signout"),
  studentProfileMini: $("student-profile-mini"),
  studentWindowBadge: $("student-window-badge"),
  enableLocation: $("enable-location"),
  checkInBtn: $("check-in-btn"),
  studentStatusText: $("student-status-text"),
  distanceOutput: $("distance-output"),
  accuracyOutput: $("accuracy-output"),
  studentMessage: $("student-message"),
  historyCount: $("history-count"),
  historyList: $("history-list"),
  locationDot: $("location-dot"),

  instructorAvatar: $("instructor-avatar"),
  instructorSignout: $("instructor-signout"),
  courseName: $("course-name"),
  instructorName: $("instructor-name"),
  roomName: $("room-name"),
  latitude: $("latitude"),
  longitude: $("longitude"),
  radius: $("radius"),
  useCurrentClassroomLocation: $("use-current-classroom-location"),
  saveClassroomSettings: $("save-classroom-settings"),
  toggleWindow: $("toggle-window"),
  instructorWindowText: $("instructor-window-text"),
  instructorClassroomText: $("instructor-classroom-text"),
  instructorRadiusText: $("instructor-radius-text"),
  instructorMessage: $("instructor-message"),
  rosterCount: $("roster-count"),
  rosterList: $("roster-list")
};

start();

function start() {
  bindEvents();
  render();
}

function bindEvents() {
  ui.openSigninModal.addEventListener("click", () => show(ui.signinModal));
  ui.closeSigninModal.addEventListener("click", () => hide(ui.signinModal));
  document.querySelector(".modal-backdrop").addEventListener("click", () => hide(ui.signinModal));

  ui.githubSigninSubmit.addEventListener("click", signInWithGithub);

  ui.studentSignout.addEventListener("click", signOut);
  ui.instructorSignout.addEventListener("click", signOut);

  ui.enableLocation.addEventListener("click", getStudentLocation);
  ui.checkInBtn.addEventListener("click", checkIn);

  ui.useCurrentClassroomLocation.addEventListener("click", getInstructorLocation);
  ui.saveClassroomSettings.addEventListener("click", saveClassroom);
  ui.toggleWindow.addEventListener("click", toggleWindow);
}

function render() {
  renderShared();
  renderScreens();
  renderStudent();
  renderInstructor();
}

function renderShared() {
  ui.authCourseName.textContent = state.classroom.courseName;
  ui.authCourseMeta.textContent = `${state.classroom.instructorName} | Room ${state.classroom.room}`;
}

function renderScreens() {
  hide(ui.authScreen);
  hide(ui.studentScreen);
  hide(ui.instructorScreen);

  if (!state.user) {
    show(ui.authScreen);
    return;
  }

  if (state.user.role === "student") {
    show(ui.studentScreen);
  } else {
    show(ui.instructorScreen);
  }
}

function renderStudent() {
  if (!state.user || state.user.role !== "student") return;

  setAvatar(ui.studentAvatar, state.user.avatarUrl);

  ui.studentProfileMini.innerHTML = `
    <img src="${safe(state.user.avatarUrl)}" alt="${safe(state.user.name)} avatar">
    <div>
      <strong>${safe(state.user.name)}</strong>
      <p>@${safe(state.user.username)}</p>
    </div>
  `;

  const check = getCheckState();

  ui.studentWindowBadge.textContent = check.badge;
  ui.studentWindowBadge.className = `window-badge ${check.badgeClass}`;
  ui.checkInBtn.disabled = !check.allowed;

  if (state.location) {
    show(ui.locationDot);
    ui.studentStatusText.textContent = "Location captured successfully.";
    ui.distanceOutput.textContent = check.distance === null ? "—" : `${check.distance.toFixed(1)} m`;
    ui.accuracyOutput.textContent = `${Math.round(state.location.accuracy)} m`;
  } else {
    hide(ui.locationDot);
    ui.studentStatusText.textContent = "Waiting for location data...";
    ui.distanceOutput.textContent = "—";
    ui.accuracyOutput.textContent = "—";
  }

  const history = state.checkins
    .filter((item) => item.userId === state.user.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  ui.historyCount.textContent = history.length;

  if (history.length === 0) {
    ui.historyList.innerHTML = `<li class="empty-item">No attendance records yet.</li>`;
  } else {
    ui.historyList.innerHTML = history.map((item) => `
      <li class="history-item">
        <h4>${safe(item.courseName)}</h4>
        <p>${formatDate(item.timestamp)} · Room ${safe(item.room)}</p>
        <small>Status: Present · Distance: ${item.distance.toFixed(1)} m</small>
      </li>
    `).join("");
  }
}

function renderInstructor() {
  if (!state.user || state.user.role !== "instructor") return;

  setAvatar(ui.instructorAvatar, state.user.avatarUrl);

  ui.courseName.value = state.classroom.courseName;
  ui.instructorName.value = state.classroom.instructorName;
  ui.roomName.value = state.classroom.room;
  ui.latitude.value = state.classroom.latitude ?? "";
  ui.longitude.value = state.classroom.longitude ?? "";
  ui.radius.value = state.classroom.radius;

  ui.instructorWindowText.textContent = state.classroom.windowOpen
    ? `Open since ${formatTime(state.classroom.openedAt)}`
    : "Closed";

  ui.instructorClassroomText.textContent = state.classroom.room;
  ui.instructorRadiusText.textContent = `${state.classroom.radius} m`;
  ui.toggleWindow.textContent = state.classroom.windowOpen
    ? "Close check-in Window"
    : "Open check-in Window";

  const roster = activeRoster();
  ui.rosterCount.textContent = roster.length;

  if (roster.length === 0) {
    ui.rosterList.innerHTML = `<li class="empty-item">No students checked in yet.</li>`;
  } else {
    ui.rosterList.innerHTML = roster.map((item) => `
      <li class="history-item">
        <h4>${safe(item.userName)}</h4>
        <p>@${safe(item.username)} · Checked in at ${formatTime(item.timestamp)}</p>
        <small>Distance: ${item.distance.toFixed(1)} m</small>
      </li>
    `).join("");
  }
}

async function signInWithGithub() {
  const username = ui.githubUsername.value.trim();
  const role = ui.signinRole.value;

  clearMessage(ui.authMessage);

  if (!username) {
    return message(ui.authMessage, "Please enter a GitHub username.", "error");
  }

  loading(ui.githubSigninSubmit, true, "Signing in...");

  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error("GitHub user not found.");

    const data = await res.json();

    state.user = {
      id: String(data.id || username.toLowerCase()),
      username: data.login || username,
      name: data.name || data.login || username,
      avatarUrl: data.avatar_url || "",
      role: role
    };

    state.location = null;
    save();
    hide(ui.signinModal);
    render();
  } catch (error) {
    message(ui.authMessage, error.message || "Sign-in failed.", "error");
  } finally {
    loading(ui.githubSigninSubmit, false, "Continue");
  }
}

function signOut() {
  state.user = null;
  state.location = null;
  save();
  clearMessage(ui.studentMessage);
  clearMessage(ui.instructorMessage);
  render();
}

async function getStudentLocation() {
  clearMessage(ui.studentMessage);
  loading(ui.enableLocation, true, "Getting location...");

  try {
    const pos = await currentPosition();
    state.location = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    };
    save();
    message(ui.studentMessage, "Location enabled successfully.", "success");
    render();
  } catch (error) {
    message(ui.studentMessage, locationError(error), "error");
  } finally {
    loading(ui.enableLocation, false, "Enable Location");
  }
}

async function getInstructorLocation() {
  clearMessage(ui.instructorMessage);
  loading(ui.useCurrentClassroomLocation, true, "Getting location...");

  try {
    const pos = await currentPosition();
    ui.latitude.value = pos.coords.latitude.toFixed(6);
    ui.longitude.value = pos.coords.longitude.toFixed(6);
    message(ui.instructorMessage, "Current location captured. Now save setup.", "success");
  } catch (error) {
    message(ui.instructorMessage, locationError(error), "error");
  } finally {
    loading(ui.useCurrentClassroomLocation, false, "Use Current Location");
  }
}

function saveClassroom() {
  clearMessage(ui.instructorMessage);

  const courseName = ui.courseName.value.trim();
  const instructorName = ui.instructorName.value.trim();
  const room = ui.roomName.value.trim();
  const latitude = parseFloat(ui.latitude.value);
  const longitude = parseFloat(ui.longitude.value);
  const radius = parseInt(ui.radius.value, 10);

  if (!courseName || !instructorName || !room) {
    return message(ui.instructorMessage, "Fill in course name, instructor name, and room.", "error");
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return message(ui.instructorMessage, "Enter a valid latitude and longitude.", "error");
  }

  if (!Number.isFinite(radius) || radius <= 0) {
    return message(ui.instructorMessage, "Enter a valid radius.", "error");
  }

  state.classroom.courseName = courseName;
  state.classroom.instructorName = instructorName;
  state.classroom.room = room;
  state.classroom.latitude = latitude;
  state.classroom.longitude = longitude;
  state.classroom.radius = radius;

  save();
  message(ui.instructorMessage, "Classroom setup saved.", "success");
  render();
}

function toggleWindow() {
  clearMessage(ui.instructorMessage);

  if (!Number.isFinite(state.classroom.latitude) || !Number.isFinite(state.classroom.longitude)) {
    return message(ui.instructorMessage, "Save classroom coordinates first.", "error");
  }

  if (state.classroom.windowOpen) {
    state.classroom.windowOpen = false;
    state.classroom.sessionId = null;
    message(ui.instructorMessage, "Attendance window closed.", "info");
  } else {
    state.classroom.windowOpen = true;
    state.classroom.sessionId = `session-${Date.now()}`;
    state.classroom.openedAt = new Date().toISOString();
    message(ui.instructorMessage, "Attendance window opened.", "success");
  }

  save();
  render();
}

function checkIn() {
  clearMessage(ui.studentMessage);

  const check = getCheckState();
  if (!check.allowed) {
    return message(ui.studentMessage, check.message, check.type);
  }

  state.checkins.push({
    id: `checkin-${Date.now()}`,
    sessionId: state.classroom.sessionId,
    userId: state.user.id,
    userName: state.user.name,
    username: state.user.username,
    courseName: state.classroom.courseName,
    room: state.classroom.room,
    distance: check.distance,
    timestamp: new Date().toISOString()
  });

  save();
  message(ui.studentMessage, `Success. You were marked present at ${formatTime(new Date())}.`, "success");
  render();
}

function getCheckState() {
  if (!state.user || state.user.role !== "student") {
    return {
      allowed: false,
      badge: "Student only",
      badgeClass: "closed",
      message: "Sign in as a student first.",
      type: "warning",
      distance: null
    };
  }

  if (!state.classroom.windowOpen || !state.classroom.sessionId) {
    return {
      allowed: false,
      badge: "Window closed",
      badgeClass: "closed",
      message: "The instructor has not opened the check-in window yet.",
      type: "warning",
      distance: null
    };
  }

  if (!state.location) {
    return {
      allowed: false,
      badge: "Need location",
      badgeClass: "closed",
      message: "Please enable location first.",
      type: "warning",
      distance: null
    };
  }

  const distance = haversine(
    state.location.latitude,
    state.location.longitude,
    state.classroom.latitude,
    state.classroom.longitude
  );

  const duplicate = state.checkins.some((item) =>
    item.sessionId === state.classroom.sessionId && item.userId === state.user.id
  );

  if (duplicate) {
    return {
      allowed: false,
      badge: "Already checked in",
      badgeClass: "closed",
      message: "Duplicate attendance is not allowed.",
      type: "info",
      distance
    };
  }

  if (distance > state.classroom.radius) {
    return {
      allowed: false,
      badge: "Outside radius",
      badgeClass: "error",
      message: `You are outside the allowed radius. Distance: ${distance.toFixed(1)} m.`,
      type: "error",
      distance
    };
  }

  return {
    allowed: true,
    badge: "Ready to check in",
    badgeClass: "open",
    message: "You are inside the allowed radius.",
    type: "success",
    distance
  };
}

function activeRoster() {
  if (!state.classroom.sessionId) return [];
  return state.checkins.filter((item) => item.sessionId === state.classroom.sessionId);
}

function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function load() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? { ...defaultState, ...JSON.parse(saved), classroom: { ...defaultState.classroom, ...JSON.parse(saved).classroom } } : structured();
  } catch {
    return structured();
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function structured() {
  return JSON.parse(JSON.stringify(defaultState));
}

function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

function setAvatar(el, url) {
  el.style.backgroundImage = url ? `url("${url}")` : "none";
}

function message(el, text, type) {
  el.textContent = text;
  el.className = `message ${type}`;
  show(el);
}

function clearMessage(el) {
  el.textContent = "";
  el.className = "message hidden";
}

function loading(btn, isLoading, text) {
  if (!btn.dataset.text) btn.dataset.text = btn.textContent;
  btn.disabled = isLoading;
  btn.textContent = isLoading ? text : btn.dataset.text;
}

function locationError(error) {
  if (error.message === "Geolocation is not supported in this browser.") return error.message;
  if (error.code === 1) return "Location access was denied.";
  if (error.code === 2) return "Location could not be determined.";
  if (error.code === 3) return "Location request timed out.";
  return "Unexpected location error.";
}

function formatDate(value) {
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function safe(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}