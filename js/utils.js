// Auth guard — redirect to login if not authenticated
async function requireAuth() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

// Get current user ID
async function getUserId() {
    const { data: { user } } = await sb.auth.getUser();
    return user?.id;
}

// Sign out
async function signOut() {
    await sb.auth.signOut();
    window.location.href = 'login.html';
}

// Format duration from ms
function formatDuration(ms) {
    if (!ms || ms < 0) return '—';
    const totalMin = Math.floor(ms / 60000);
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
}

// Format duration from two ISO timestamps
function durationBetween(start, end) {
    if (!start || !end) return null;
    return new Date(end) - new Date(start);
}

// Format a date for display
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

// Format time for display
function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Format datetime for display
function formatDateTime(dateStr) {
    return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

// Get date range bounds (start of day, end of day) for a given range
function getDateRange(range) {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    switch (range) {
        case '24h':
            start.setTime(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '7d':
            start.setDate(start.getDate() - 6);
            break;
        case '14d':
            start.setDate(start.getDate() - 13);
            break;
        case '30d':
            start.setDate(start.getDate() - 29);
            break;
        case '90d':
            start.setDate(start.getDate() - 89);
            break;
        default:
            start.setDate(start.getDate() - 6);
    }

    return { start: start.toISOString(), end: end.toISOString() };
}

// Format datetime-local input value from Date
function toDatetimeLocal(date) {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Escape user-provided text before inserting into innerHTML
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Show toast notification
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Populate nav with active state (Intercom is reachable from the settings sheet)
function initNav(activePage) {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const pages = [
        { href: 'dashboard.html', label: 'Home', icon: 'layout-dashboard' },
        { href: 'feeding.html', label: 'Feeding', icon: 'milk' },
        { href: 'sleep.html', label: 'Sleep', icon: 'moon' },
        { href: 'weight.html', label: 'Weight', icon: 'scale' },
    ];

    nav.innerHTML = pages.map(p => `
        <a href="${p.href}" class="nav-item ${p.href === activePage ? 'active' : ''}">
            <span class="nav-icon">${icon(p.icon)}</span>
            <span class="nav-label">${p.label}</span>
        </a>
    `).join('');
}

// Format an age from a birth date, e.g. "5 weeks, 3 days old"
function formatAge(birthDate) {
    const days = Math.floor((Date.now() - new Date(birthDate).getTime()) / 86400000);
    if (days < 0) return 'arriving soon';
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} old`;
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    if (rem === 0) return `${weeks} week${weeks === 1 ? '' : 's'} old`;
    return `${weeks} week${weeks === 1 ? '' : 's'}, ${rem} day${rem === 1 ? '' : 's'} old`;
}

// --- User preferences (user_preferences table), cached per page load ---
let _userPrefs = null;

async function loadUserPrefs(force = false) {
    if (_userPrefs && !force) return _userPrefs;
    const userId = await getUserId();
    const { data, error } = await sb
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) {
        console.error('Failed to load preferences:', error.message);
    }
    _userPrefs = data || {};
    return _userPrefs;
}

async function saveUserPrefs(partial) {
    const userId = await getUserId();
    const { data: existing, error: selError } = await sb
        .from('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
    if (selError) {
        console.error('Failed to read preferences:', selError.message);
        return { error: selError };
    }
    let error;
    if (existing) {
        ({ error } = await sb.from('user_preferences').update(partial).eq('user_id', userId));
    } else {
        ({ error } = await sb.from('user_preferences').insert({ user_id: userId, ...partial }));
    }
    if (error) {
        console.error('Failed to save preferences:', error.message);
    } else {
        _userPrefs = { ...(_userPrefs || {}), ...partial };
    }
    return { error };
}
