// Theme — dark ("Almond night") is the default; light is opt-in.
// Loaded in <head> before the stylesheet paints so there is no theme flash.
(function () {
    let stored = null;
    try {
        stored = localStorage.getItem('bt_theme');
    } catch (_) {}
    applyThemeAttributes(stored === 'light' ? 'light' : 'dark');
})();

function applyThemeAttributes(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F0E6D8' : '#1B1713');
}

function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function setTheme(theme) {
    applyThemeAttributes(theme);
    try {
        localStorage.setItem('bt_theme', theme);
    } catch (_) {}
}
