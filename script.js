const STORAGE_KEY = 'attendance-tracker-state-v1';
const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};

const defaultState = {
  classroom: {
    courseName: 'MAD9014 - Interactive Media Design',
    instructorName: 'Prof. David P.',
    room: 'C104',
    latitude: null,
    longitude: null,
    radius: 50,
    windowOpen: false,
    activeSessionId: null,
    lastOpenedAt: null,
    lastClosedAt: null
  },
  currentUser: null,
  latestStudentLocation: null,
  checkins: []
};

let state = loadState();

const elements = {
  userChip: document.getElementById('user-chip'),
  signOutBtn: document.getElementById('sign-out-btn'),
  signInForm: document.getElementById('sign-in-form'),
  signInBtn: document.getElementById('sign-in-btn'),
  githubUsername: document.getElementById('github-username'),
  roleSelect: document.getElementById('role-select'),
  authFeedback: document.getElementById('auth-feedback'),
  profilePreview: document.getElementById('profile-preview'),

  studentPanel: document.getElementById('student-panel'),
  studentEligibilityPill: document.getElementById('student-eligibility-pill'),
  studentCourseName: document.getElementById('student-course-name'),
  studentCourseMeta: document.getElementById('student-course-meta'),
  locationStatusText: document.getElementById('location-status-text'),
  distanceReadout: document.getElementById('distance-readout'),
  accuracyReadout: document.getElementById('accuracy-readout'),
  enableLocationBtn: document.getElementById('enable-location-btn'),
  checkInBtn: document.getElementById('check-in-btn'),
  studentFeedback: document.getElementById('student-feedback'),
  historyList: document.getElementById('history-list'),
  historyCount: document.getElementById('history-count'),

  instructorPanel: document.getElementById('instructor-panel'),
  sessionPill: document.getElementById('session-pill'),
  classroomForm: document.getElementById('classroom-form'),
  courseNameInput: document.getElementById('course-name-input'),
  instructorNameInput: document.getElementById('instructor-name-input'),
  roomInput: document.getElementById('room-input'),
  latitudeInput: document.getElementById('latitude-input'),
  longitudeInput: document.getElementById('longitude-input'),
  radiusInput: document.getElementById('radius-input'),
  useCurrentLocationBtn: document.getElementById('use-current-location-btn'),
  toggleWindowBtn: document.getElementById('toggle-window-btn'),
  seedDemoBtn: document.getElementById('seed-demo-btn'),
  resetDemoBtn: document.getElementById('reset-demo-btn'),
  instructorFeedback: document.getElementById('instructor-feedback'),
  rosterList: document.getElementById('roster-list'),
  liveRosterCount: document.getElementById('live-roster-count'),

  windowStatusPill: document.getElementById('window-status-pill'),
  radiusReadout: document.getElementById('radius-readout'),
  roomReadout: document.getElementById('room-readout'),
  courseReadout: document.getElementById('course-readout'),
  rosterCount: document.getElementById('roster-count')
};

init();

function init() {
  bindEvents();
  render();
}

function bindEvents() {
  elements.signInForm.addEventListener('submit', handleSignIn);
  elements.signOutBtn.addEventListener('click', handleSignOut);
  elements.enableLocationBtn.addEventListener('click', handleEnableLocation);
  elements.checkInBtn.addEventListener('click', handleCheckIn);
  elements.classroomForm.addEventListener('submit', handleSaveClassroom);
  elements.useCurrentLocationBtn.addEventListener('click', handleUseCurrentLocation);
  elements.toggleWindowBtn.addEventListener('click', handleToggleWindow);
  elements.seedDemoBtn.addEventListener('click', handleSeedDemoData);
  elements.resetDemoBtn.addEventListener('click', handleResetDemoData);
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return structuredClone(defaultState);
    }

    const parsed = JSON.parse(saved);
    return {
      classroom: {
        ...defaultState.classroom,
        ...(parsed.classroom || {})
      },
      currentUser: parsed.currentUser || null,
      latestStudentLocation: parsed.latestStudentLocation || null,
      checkins: Array.isArray(parsed.checkins) ? parsed.checkins : []
    };
  } catch (error) {
    console.error('Failed to load state:', error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderTopSummary();
  renderAuthState();
  renderStudentPanel();
  renderInstructorPanel();
}

function renderTopSummary() {
  const activeSessionCheckins = getActiveSessionCheckins();
  elements.windowStatusPill.textContent = state.classroom.windowOpen ? 'Open' : 'Closed';
  elements.windowStatusPill.className = `pill ${state.classroom.windowOpen ? 'pill-success' : 'pill-muted'}`;
  elements.radiusReadout.textContent = `${Number(state.classroom.radius) || 0} m`;
  elements.roomReadout.textContent = state.classroom.room || 'Not set';
  elements.courseReadout.textContent = state.classroom.courseName || 'Not set';
  elements.rosterCount.textContent = `${activeSessionCheckins.length} ${activeSessionCheckins.length === 1 ? 'student' : 'students'}`;
}

function renderAuthState() {
  const user = state.currentUser;

  if (!user) {
    elements.userChip.classList.add('hidden');
    elements.signOutBtn.classList.add('hidden');
    elements.profilePreview.classList.add('hidden');
    elements.signInForm.classList.remove('hidden');
    return;
  }

  elements.userChip.innerHTML = `
    <img src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(user.name)} avatar">
    <div>
      <strong>${escapeHtml(user.name)}</strong>
      <small>${capitalize(user.role)} · @${escapeHtml(user.username)}</small>
    </div>
  `;
  elements.userChip.classList.remove('hidden');
  elements.signOutBtn.classList.remove('hidden');
  elements.signInForm.classList.add('hidden');

  elements.profilePreview.innerHTML = `
    <img src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(user.name)} avatar">
    <div class="profile-text">
      <h3>${escapeHtml(user.name)}</h3>
      <p>@${escapeHtml(user.username)}</p>
      <p class="profile-meta">Signed in as ${capitalize(user.role)} · Public GitHub profile fetched successfully.</p>
    </div>
  `;
  elements.profilePreview.classList.remove('hidden');
}

function renderStudentPanel() {
  const classroom = state.classroom;
  const user = state.currentUser;
  const isStudent = user && user.role === 'student';
  const studentLocation = state.latestStudentLocation;
  const checkinState = getStudentCheckInState();

  elements.studentCourseName.textContent = classroom.courseName || 'Course name not set';
  elements.studentCourseMeta.textContent = `${classroom.instructorName || 'Instructor not set'} | Room ${classroom.room || '—'}`;
  elements.studentFeedback.classList.add('hidden');

  if (!isStudent) {
    elements.studentEligibilityPill.textContent = 'Sign in as a student';
    elements.studentEligibilityPill.className = 'pill pill-muted';
    elements.locationStatusText.textContent = 'Student tools unlock after a student signs in.';
    elements.distanceReadout.textContent = '—';
    elements.accuracyReadout.textContent = '—';
    elements.enableLocationBtn.disabled = true;
    elements.checkInBtn.disabled = true;
    renderHistoryList([]);
    return;
  }

  elements.enableLocationBtn.disabled = false;
  elements.checkInBtn.disabled = !checkinState.allowed;
  elements.studentEligibilityPill.textContent = checkinState.label;
  elements.studentEligibilityPill.className = `pill ${checkinState.pillClass}`;
  elements.locationStatusText.textContent = studentLocation
    ? `Location captured at ${formatDateTime(studentLocation.timestamp)}.`
    : 'Location not requested yet.';
  elements.distanceReadout.textContent = studentLocation && Number.isFinite(checkinState.distance)
    ? `${checkinState.distance.toFixed(1)} m`
    : '—';
  elements.accuracyReadout.textContent = studentLocation
    ? `${Math.round(studentLocation.accuracy)} m`
    : '—';

  const userHistory = state.checkins
    .filter((record) => record.userId === user.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  renderHistoryList(userHistory);
}

function renderHistoryList(history) {
  elements.historyCount.textContent = `${history.length} ${history.length === 1 ? 'record' : 'records'}`;

  if (history.length === 0) {
    elements.historyList.innerHTML = '<li class="empty-item">No attendance records yet.</li>';
    return;
  }

  elements.historyList.innerHTML = history
    .map((record) => `
      <li class="list-line">
        <div>
          <h4>${escapeHtml(record.courseName)}</h4>
          <p>${escapeHtml(record.room)} · ${formatDateTime(record.timestamp)}</p>
          <small>Status: ${escapeHtml(record.status)} · Distance: ${record.distance.toFixed(1)} m</small>
        </div>
        <span class="pill pill-success">Present</span>
      </li>
    `)
    .join('');
}

function renderInstructorPanel() {
  const user = state.currentUser;
  const isInstructor = user && user.role === 'instructor';
  const classroom = state.classroom;
  const activeSessionCheckins = getActiveSessionCheckins();

  elements.courseNameInput.value = classroom.courseName || '';
  elements.instructorNameInput.value = classroom.instructorName || '';
  elements.roomInput.value = classroom.room || '';
  elements.latitudeInput.value = classroom.latitude ?? '';
  elements.longitudeInput.value = classroom.longitude ?? '';
  elements.radiusInput.value = classroom.radius ?? 50;

  if (!isInstructor) {
    elements.instructorPanel.style.opacity = '0.78';
    elements.toggleWindowBtn.disabled = true;
    elements.useCurrentLocationBtn.disabled = true;
    elements.seedDemoBtn.disabled = true;
    elements.resetDemoBtn.disabled = true;
    elements.classroomForm.querySelectorAll('input').forEach((input) => {
      input.disabled = true;
    });
    elements.classroomForm.querySelector('button[type="submit"]').disabled = true;
  } else {
    elements.instructorPanel.style.opacity = '1';
    elements.toggleWindowBtn.disabled = false;
    elements.useCurrentLocationBtn.disabled = false;
    elements.seedDemoBtn.disabled = false;
    elements.resetDemoBtn.disabled = false;
    elements.classroomForm.querySelectorAll('input').forEach((input) => {
      input.disabled = false;
    });
    elements.classroomForm.querySelector('button[type="submit"]').disabled = false;
  }

  elements.sessionPill.textContent = classroom.windowOpen
    ? `Session active · ${formatDateTime(classroom.lastOpenedAt)}`
    : 'No active session';
  elements.sessionPill.className = `pill ${classroom.windowOpen ? 'pill-success' : 'pill-muted'}`;
  elements.toggleWindowBtn.textContent = classroom.windowOpen ? 'Close check-in window' : 'Open check-in window';
  elements.liveRosterCount.textContent = `${activeSessionCheckins.length} ${activeSessionCheckins.length === 1 ? 'present' : 'present'}`;

  if (activeSessionCheckins.length === 0) {
    elements.rosterList.innerHTML = '<li class="empty-item">No students have checked in for the active session.</li>';
    return;
  }

  elements.rosterList.innerHTML = activeSessionCheckins
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((record) => `
      <li class="list-line">
        <div>
          <h4>${escapeHtml(record.userName)}</h4>
          <p>@${escapeHtml(record.username)} · Checked in at ${formatTime(record.timestamp)}</p>
          <small>Distance: ${record.distance.toFixed(1)} m · Accuracy: ${Math.round(record.accuracy)} m</small>
        </div>
        <span class="pill pill-success">Present</span>
      </li>
    `)
    .join('');
}

async function handleSignIn(event) {
  event.preventDefault();
  const username = elements.githubUsername.value.trim();
  const role = elements.roleSelect.value;

  if (!username) {
    showFeedback(elements.authFeedback, 'Please enter a GitHub username.', 'error');
    return;
  }

  toggleLoading(elements.signInBtn, true, 'Signing in...');
  showFeedback(elements.authFeedback, 'Fetching public GitHub profile...', 'info');

  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);

    if (!response.ok) {
      throw new Error('GitHub profile not found. Try another public username.');
    }

    const profile = await response.json();
    state.currentUser = {
      id: profile.id ? String(profile.id) : `demo-${username.toLowerCase()}`,
      username: profile.login,
      name: profile.name || profile.login,
      avatarUrl: profile.avatar_url,
      profileUrl: profile.html_url,
      role
    };

    saveState();
    elements.signInForm.reset();
    showFeedback(elements.authFeedback, `${state.currentUser.name} signed in successfully as ${role}.`, 'success');
    render();
  } catch (error) {
    showFeedback(elements.authFeedback, error.message || 'Unable to sign in right now.', 'error');
  } finally {
    toggleLoading(elements.signInBtn, false, 'Sign in with GitHub profile');
  }
}

function handleSignOut() {
  state.currentUser = null;
  state.latestStudentLocation = null;
  saveState();
  showFeedback(elements.authFeedback, 'Signed out successfully.', 'info');
  render();
}

async function handleEnableLocation() {
  if (!state.currentUser || state.currentUser.role !== 'student') {
    showFeedback(elements.studentFeedback, 'Sign in as a student to request location.', 'warning');
    return;
  }

  toggleLoading(elements.enableLocationBtn, true, 'Getting location...');

  try {
    const position = await getCurrentPosition();
    state.latestStudentLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date(position.timestamp).toISOString()
    };
    saveState();
    showFeedback(elements.studentFeedback, 'Location permission granted. Your current coordinates are ready for validation.', 'success');
    render();
  } catch (error) {
    showFeedback(elements.studentFeedback, getGeolocationErrorMessage(error), 'error');
  } finally {
    toggleLoading(elements.enableLocationBtn, false, 'Enable location');
  }
}

function handleSaveClassroom(event) {
  event.preventDefault();

  if (!state.currentUser || state.currentUser.role !== 'instructor') {
    showFeedback(elements.instructorFeedback, 'Sign in as an instructor to save classroom settings.', 'warning');
    return;
  }

  const courseName = elements.courseNameInput.value.trim();
  const instructorName = elements.instructorNameInput.value.trim();
  const room = elements.roomInput.value.trim();
  const latitude = parseFloat(elements.latitudeInput.value);
  const longitude = parseFloat(elements.longitudeInput.value);
  const radius = parseInt(elements.radiusInput.value, 10);

  if (!courseName || !instructorName || !room || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(radius) || radius <= 0) {
    showFeedback(elements.instructorFeedback, 'Please complete all classroom fields with valid values.', 'error');
    return;
  }

  state.classroom = {
    ...state.classroom,
    courseName,
    instructorName,
    room,
    latitude,
    longitude,
    radius
  };

  saveState();
  showFeedback(elements.instructorFeedback, 'Classroom setup saved successfully.', 'success');
  render();
}

async function handleUseCurrentLocation() {
  if (!state.currentUser || state.currentUser.role !== 'instructor') {
    showFeedback(elements.instructorFeedback, 'Sign in as an instructor to capture the classroom location.', 'warning');
    return;
  }

  toggleLoading(elements.useCurrentLocationBtn, true, 'Capturing...');

  try {
    const position = await getCurrentPosition();
    elements.latitudeInput.value = position.coords.latitude.toFixed(6);
    elements.longitudeInput.value = position.coords.longitude.toFixed(6);
    showFeedback(elements.instructorFeedback, 'Current location captured. Save the classroom setup to apply it.', 'success');
  } catch (error) {
    showFeedback(elements.instructorFeedback, getGeolocationErrorMessage(error), 'error');
  } finally {
    toggleLoading(elements.useCurrentLocationBtn, false, 'Use my current location');
  }
}

function handleToggleWindow() {
  if (!state.currentUser || state.currentUser.role !== 'instructor') {
    showFeedback(elements.instructorFeedback, 'Only the instructor can change the attendance window.', 'warning');
    return;
  }

  if (!Number.isFinite(Number(state.classroom.latitude)) || !Number.isFinite(Number(state.classroom.longitude))) {
    showFeedback(elements.instructorFeedback, 'Set and save the classroom coordinates before opening the window.', 'error');
    return;
  }

  if (!state.classroom.windowOpen) {
    state.classroom.windowOpen = true;
    state.classroom.lastOpenedAt = new Date().toISOString();
    state.classroom.activeSessionId = `session-${Date.now()}`;
    showFeedback(elements.instructorFeedback, 'Check-in window is now open.', 'success');
  } else {
    state.classroom.windowOpen = false;
    state.classroom.lastClosedAt = new Date().toISOString();
    state.classroom.activeSessionId = null;
    showFeedback(elements.instructorFeedback, 'Check-in window has been closed.', 'info');
  }

  saveState();
  render();
}

function handleCheckIn() {
  const user = state.currentUser;
  const checkInState = getStudentCheckInState();

  if (!user || user.role !== 'student') {
    showFeedback(elements.studentFeedback, 'Sign in as a student to check in.', 'warning');
    return;
  }

  if (!checkInState.allowed) {
    showFeedback(elements.studentFeedback, checkInState.message, checkInState.feedbackType);
    return;
  }

  const record = {
    id: `checkin-${Date.now()}`,
    sessionId: state.classroom.activeSessionId,
    userId: user.id,
    userName: user.name,
    username: user.username,
    courseName: state.classroom.courseName,
    room: state.classroom.room,
    distance: checkInState.distance,
    accuracy: state.latestStudentLocation.accuracy,
    status: 'Present',
    timestamp: new Date().toISOString()
  };

  state.checkins.push(record);
  saveState();
  showFeedback(elements.studentFeedback, `Success! You have been marked present at ${formatTime(record.timestamp)}.`, 'success');
  render();
}

function handleSeedDemoData() {
  if (!state.currentUser || state.currentUser.role !== 'instructor') {
    showFeedback(elements.instructorFeedback, 'Sign in as an instructor to load demo records.', 'warning');
    return;
  }

  if (!state.classroom.windowOpen || !state.classroom.activeSessionId) {
    showFeedback(elements.instructorFeedback, 'Open the check-in window first so the sample records attach to an active session.', 'warning');
    return;
  }

  const sampleRecords = [
    {
      id: `seed-${Date.now()}-1`,
      sessionId: state.classroom.activeSessionId,
      userId: '1001',
      userName: 'Ava Chen',
      username: 'avachen-demo',
      courseName: state.classroom.courseName,
      room: state.classroom.room,
      distance: 4.8,
      accuracy: 9,
      status: 'Present',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString()
    },
    {
      id: `seed-${Date.now()}-2`,
      sessionId: state.classroom.activeSessionId,
      userId: '1002',
      userName: 'Noah Patel',
      username: 'noahpatel-demo',
      courseName: state.classroom.courseName,
      room: state.classroom.room,
      distance: 11.2,
      accuracy: 11,
      status: 'Present',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString()
    }
  ];

  const existingUserIds = new Set(getActiveSessionCheckins().map((record) => record.userId));
  const newRecords = sampleRecords.filter((record) => !existingUserIds.has(record.userId));

  if (newRecords.length === 0) {
    showFeedback(elements.instructorFeedback, 'Sample records are already loaded for this session.', 'info');
    return;
  }

  state.checkins.push(...newRecords);
  saveState();
  showFeedback(elements.instructorFeedback, 'Sample records added to the live roster.', 'success');
  render();
}

function handleResetDemoData() {
  if (!confirm('Reset all demo data? This will remove the signed-in user, settings, and attendance records.')) {
    return;
  }

  state = structuredClone(defaultState);
  saveState();
  showFeedback(elements.authFeedback, 'All demo data has been reset.', 'info');
  showFeedback(elements.instructorFeedback, 'All demo data has been reset.', 'info');
  render();
}

function getStudentCheckInState() {
  const user = state.currentUser;
  const classroom = state.classroom;
  const studentLocation = state.latestStudentLocation;

  if (!user || user.role !== 'student') {
    return {
      allowed: false,
      label: 'Sign in as a student',
      pillClass: 'pill-muted',
      message: 'Sign in as a student to check in.',
      feedbackType: 'warning',
      distance: null
    };
  }

  if (!classroom.windowOpen || !classroom.activeSessionId) {
    return {
      allowed: false,
      label: 'Window closed',
      pillClass: 'pill-warning',
      message: 'The instructor has not opened the attendance window yet.',
      feedbackType: 'warning',
      distance: null
    };
  }

  if (!studentLocation) {
    return {
      allowed: false,
      label: 'Need location',
      pillClass: 'pill-warning',
      message: 'Please enable location access before checking in.',
      feedbackType: 'warning',
      distance: null
    };
  }

  if (!Number.isFinite(Number(classroom.latitude)) || !Number.isFinite(Number(classroom.longitude))) {
    return {
      allowed: false,
      label: 'Classroom not set',
      pillClass: 'pill-error',
      message: 'The classroom coordinates have not been configured yet.',
      feedbackType: 'error',
      distance: null
    };
  }

  const distance = haversineDistance(
    studentLocation.latitude,
    studentLocation.longitude,
    classroom.latitude,
    classroom.longitude
  );

  const alreadyCheckedIn = state.checkins.some((record) => {
    return record.sessionId === classroom.activeSessionId && record.userId === user.id;
  });

  if (alreadyCheckedIn) {
    return {
      allowed: false,
      label: 'Already checked in',
      pillClass: 'pill-info',
      message: 'Duplicate attendance is not allowed during the same session.',
      feedbackType: 'info',
      distance
    };
  }

  if (distance > Number(classroom.radius)) {
    return {
      allowed: false,
      label: 'Too far away',
      pillClass: 'pill-error',
      message: `You are outside the allowed radius. Current distance: ${distance.toFixed(1)} m.`,
      feedbackType: 'error',
      distance
    };
  }

  return {
    allowed: true,
    label: 'Eligible to check in',
    pillClass: 'pill-success',
    message: 'You are inside the allowed radius and can check in.',
    feedbackType: 'success',
    distance
  };
}

function getActiveSessionCheckins() {
  if (!state.classroom.activeSessionId) {
    return [];
  }

  return state.checkins.filter((record) => record.sessionId === state.classroom.activeSessionId);
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS);
  });
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const toRadians = (degrees) => degrees * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatTime(value) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toggleLoading(button, isLoading, loadingText) {
  if (!button.dataset.defaultText) {
    button.dataset.defaultText = button.textContent;
  }

  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : button.dataset.defaultText;
}

function showFeedback(target, message, type = 'info') {
  target.textContent = message;
  target.className = `feedback ${type}`;
  target.classList.remove('hidden');
}

function getGeolocationErrorMessage(error) {
  if (error.message === 'Geolocation is not supported in this browser.') {
    return error.message;
  }

  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access was denied. Please allow location permission and try again.';
    case error.POSITION_UNAVAILABLE:
      return 'Unable to detect your current location right now.';
    case error.TIMEOUT:
      return 'Location request timed out. Try again in a stronger signal area.';
    default:
      return 'An unexpected location error occurred.';
  }
}
