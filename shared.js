/* ============================================
   Baby Tracker — Shared JavaScript
   ============================================
   Configure SUPABASE_URL and SUPABASE_ANON_KEY
   before deploying.
   ============================================ */

// ---- Supabase Configuration ----
// Replace these with your actual Supabase project values
const SUPABASE_URL = 'https://nlkcncnzlaunxvuklgpr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sa2NuY256bGF1bnh2dWtsZ3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTYwMTgsImV4cCI6MjA4OTEzMjAxOH0.UH2ucbFNkOw_iam3n-9bmT_LXvYJZrR09978pgzhOYw';

// Initialise Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Auth Guard ----
// Call this on every protected page. Redirects to login if not authenticated.
async function requireAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

// Check if user is logged in (for login page — redirect away if already authenticated)
async function redirectIfLoggedIn() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = 'dashboard.html';
  }
}

// Sign out
async function signOut() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

// ---- Navigation ----
// Renders the bottom nav bar. `activeModule` should match the data-module value.
function renderNav(activeModule) {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const items = [
    { module: 'dashboard', icon: '📊', label: 'Home', href: 'dashboard.html' },
    { module: 'feed', icon: '🍼', label: 'Feed', href: 'feeding.html' },
    { module: 'nappy', icon: '💩', label: 'Nappy', href: 'nappy.html' },
    { module: 'sleep', icon: '😴', label: 'Sleep', href: 'sleep.html' },
    { module: 'weight', icon: '⚖️', label: 'Weight', href: 'weight.html' },
  ];

  nav.innerHTML = items.map(item => `
    <a href="${item.href}"
       class="nav-item ${item.module === activeModule ? 'active' : ''}"
       data-module="${item.module}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `).join('');

  document.body.appendChild(nav);
}

// ---- Toast Notifications ----
let toastTimeout = null;

function showToast(message, type = 'success', duration = 3000) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  if (toastTimeout) clearTimeout(toastTimeout);

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- Date/Time Utilities ----
function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDateTime(dateStr) {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

function formatDuration(minutes) {
  if (minutes < 1) return '<1 min';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Calculate duration in minutes between two ISO timestamps
function calcDuration(start, end) {
  return (new Date(end) - new Date(start)) / 60000;
}

// Get today's date as YYYY-MM-DD
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Get date N days ago as YYYY-MM-DD
function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// Current local datetime for input[type="datetime-local"]
function nowLocalISO() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

// ---- Date Range Picker ----
// Renders a date range picker with quick range buttons.
// Returns an object with getRange() method and onChange callback.
function createDateRangePicker(container, onChange) {
  container.innerHTML = `
    <div class="quick-ranges">
      <button class="quick-range-btn" data-days="1">24h</button>
      <button class="quick-range-btn" data-days="7">7d</button>
      <button class="quick-range-btn" data-days="14">14d</button>
      <button class="quick-range-btn active" data-days="30">30d</button>
      <button class="quick-range-btn" data-days="90">90d</button>
      <button class="quick-range-btn" data-days="0">All</button>
    </div>
    <div class="date-range">
      <input type="date" id="range-start" value="${daysAgoStr(30)}">
      <span class="separator">to</span>
      <input type="date" id="range-end" value="${todayStr()}">
    </div>
  `;

  const startInput = container.querySelector('#range-start');
  const endInput = container.querySelector('#range-end');
  const quickBtns = container.querySelectorAll('.quick-range-btn');

  function getRange() {
    return {
      start: startInput.value,
      end: endInput.value + 'T23:59:59'
    };
  }

  // Quick range buttons
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      quickBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const days = parseInt(btn.dataset.days);
      if (days === 0) {
        startInput.value = '2020-01-01';
      } else {
        startInput.value = daysAgoStr(days);
      }
      endInput.value = todayStr();
      if (onChange) onChange(getRange());
    });
  });

  // Manual date change
  startInput.addEventListener('change', () => {
    quickBtns.forEach(b => b.classList.remove('active'));
    if (onChange) onChange(getRange());
  });
  endInput.addEventListener('change', () => {
    quickBtns.forEach(b => b.classList.remove('active'));
    if (onChange) onChange(getRange());
  });

  return { getRange };
}

// ---- Image Compression ----
// Compresses an image file to target size (default ~200KB)
async function compressImage(file, maxSizeKB = 200, maxDimension = 1200) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if too large
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Try decreasing quality until under target size
        let quality = 0.8;
        let result;
        do {
          result = canvas.toDataURL('image/jpeg', quality);
          quality -= 0.1;
        } while (result.length > maxSizeKB * 1370 && quality > 0.1);
        // ~1370 base64 chars ≈ 1KB

        // Convert data URL to Blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality + 0.1);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---- Delete Confirmation ----
function confirmDelete(itemName = 'this entry') {
  return confirm(`Delete ${itemName}? This cannot be undone.`);
}

// ---- Supabase Helpers ----
async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}
