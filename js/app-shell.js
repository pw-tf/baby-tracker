// App shell — top app bar (avatar · name · age · settings), bottom nav,
// and the shared settings sheet. Every screen calls initAppShell(activePage).

const BABY_NAME_KEY = 'bt_baby_name';

function getBabyName() {
    try {
        return localStorage.getItem(BABY_NAME_KEY) || 'Baby';
    } catch (_) {
        return 'Baby';
    }
}

function setBabyName(name) {
    try {
        localStorage.setItem(BABY_NAME_KEY, name);
    } catch (_) {}
}

async function initAppShell(activePage) {
    renderAppBar();
    initNav(activePage);
    injectSettingsSheet();

    // React to session changes (e.g. signed out in another tab)
    sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') window.location.href = 'login.html';
    });

    await loadUserPrefs();
    refreshAppBar();
}

function renderAppBar() {
    const bar = document.getElementById('appbar');
    if (!bar) return;
    bar.innerHTML = `
        <button class="appbar-left" onclick="openSettings()" aria-label="Baby profile and settings">
            <span class="avatar" id="appbar-avatar">B</span>
            <span>
                <span class="appbar-name" id="appbar-name" style="display:block">Baby</span>
                <span class="appbar-sub" id="appbar-sub">&nbsp;</span>
            </span>
        </button>
        <button class="appbar-btn" onclick="openSettings()" aria-label="Settings">${icon('sliders')}</button>
    `;
    refreshAppBar();
}

function refreshAppBar() {
    const name = getBabyName();
    const avatarEl = document.getElementById('appbar-avatar');
    const nameEl = document.getElementById('appbar-name');
    const subEl = document.getElementById('appbar-sub');
    if (!nameEl) return;
    avatarEl.textContent = (name.trim()[0] || 'B').toUpperCase();
    nameEl.textContent = name;
    const birth = _userPrefs && _userPrefs.birth_date;
    subEl.textContent = birth ? formatAge(birth) : 'Tap to set birth date';
}

// --- Settings sheet ---
function injectSettingsSheet() {
    if (document.getElementById('settings-sheet-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'settings-sheet-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="card sheet">
            <div class="modal-header">
                <span class="sheet-title">Settings</span>
                <button class="btn-icon" onclick="closeSettings()" aria-label="Close">${icon('x')}</button>
            </div>
            <div class="settings-row">
                <span class="settings-row-label">Theme</span>
                <div class="seg-mini">
                    <button class="seg-btn" id="theme-btn-dark" onclick="chooseTheme('dark')">${icon('moon', 'icon-sm')} Dark</button>
                    <button class="seg-btn" id="theme-btn-light" onclick="chooseTheme('light')">${icon('sun', 'icon-sm')} Light</button>
                </div>
            </div>
            <div class="settings-row">
                <span class="settings-row-label">Baby's name</span>
                <input type="text" class="form-input" id="settings-name" maxlength="24" placeholder="Baby">
            </div>
            <div class="settings-row">
                <span class="settings-row-label">Birth date</span>
                <input type="datetime-local" class="form-input" id="settings-birthdate">
            </div>
            <div class="settings-row">
                <span class="settings-row-label">Intercom</span>
                <a href="intercom.html" class="pill-btn" style="text-decoration:none">${icon('radio')} Open</a>
            </div>
            <button class="btn btn-danger" style="margin-top:16px" onclick="signOut()">${icon('log-out')} Sign out</button>
        </div>
    `;
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSettings();
    });
    document.body.appendChild(overlay);

    document.getElementById('settings-name').addEventListener('change', (e) => {
        const name = e.target.value.trim() || 'Baby';
        setBabyName(name);
        refreshAppBar();
    });

    document.getElementById('settings-birthdate').addEventListener('change', async (e) => {
        if (!e.target.value) return;
        const iso = new Date(e.target.value).toISOString();
        const { error } = await saveUserPrefs({ birth_date: iso });
        if (error) {
            showToast('Could not save birth date: ' + error.message, 'error');
            return;
        }
        refreshAppBar();
        showToast('Birth date saved');
        document.dispatchEvent(new CustomEvent('bt:prefs-changed'));
    });
}

function openSettings() {
    const overlay = document.getElementById('settings-sheet-overlay');
    if (!overlay) return;
    document.getElementById('settings-name').value = getBabyName();
    const birth = _userPrefs && _userPrefs.birth_date;
    document.getElementById('settings-birthdate').value = birth ? toDatetimeLocal(new Date(birth)) : '';
    syncThemeButtons();
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
}

function closeSettings() {
    const overlay = document.getElementById('settings-sheet-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
}

function chooseTheme(theme) {
    setTheme(theme);
    syncThemeButtons();
}

function syncThemeButtons() {
    const current = getTheme();
    const darkBtn = document.getElementById('theme-btn-dark');
    const lightBtn = document.getElementById('theme-btn-light');
    if (!darkBtn) return;
    darkBtn.classList.toggle('active', current === 'dark');
    lightBtn.classList.toggle('active', current === 'light');
}
