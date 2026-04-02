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

// Populate nav with active state
function initNav(activePage) {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const pages = [
        { href: 'dashboard.html', label: 'Dashboard', icon: 'layout-dashboard' },
        { href: 'feeding.html', label: 'Feeding', icon: 'milk' },
        { href: 'nappy.html', label: 'Nappy', icon: 'baby' },
        { href: 'sleep.html', label: 'Sleep', icon: 'moon' },
        { href: 'weight.html', label: 'Weight', icon: 'scale' },
        { href: 'intercom.html', label: 'Intercom', icon: 'radio' },
    ];

    nav.innerHTML = pages.map(p => `
        <a href="${p.href}" class="nav-item ${p.href === activePage ? 'active' : ''}">
            <span class="nav-icon">${icon(p.icon)}</span>
            <span class="nav-label">${p.label}</span>
        </a>
    `).join('');
}
