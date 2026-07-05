// Lightweight CSS/SVG charts for the Almond redesign.
// Bars are plain flex columns; the weight trend is an inline SVG polyline.
// Category hue comes from the CSS --cat variable on the container.

// data: [{ value, label }] — most recent last. Last bar renders solid,
// earlier bars render tinted. Zero values render a faint stub.
function renderBarChart(el, data, opts = {}) {
    const max = Math.max(...data.map(d => d.value), 0);
    const labelStep = data.length > 10 ? Math.ceil(data.length / 7) : 1;
    el.innerHTML = data.map((d, i) => {
        const isLast = i === data.length - 1;
        const solid = opts.solidLast === false ? false : isLast;
        const pct = max > 0 ? Math.round(d.value / max * 100) : 0;
        const showLabel = i % labelStep === 0 || isLast;
        const bar = d.value > 0
            ? `<div class="bar-fill${solid ? ' solid' : ''}" style="height:${Math.max(pct, 4)}%"></div>`
            : `<div class="bar-fill" style="height:3px;opacity:0.45"></div>`;
        return `
            <div class="bar-col" data-idx="${i}">
                ${bar}
                <span class="bar-label">${showLabel ? d.label : ''}</span>
            </div>`;
    }).join('');
}

// data: [{ label, segs: [{ value, color }] }] — segs bottom-up, colors are CSS values.
// Columns are scaled to the largest daily total.
function renderStackedBarChart(el, data) {
    const max = Math.max(...data.map(d => d.segs.reduce((s, x) => s + x.value, 0)), 0);
    const labelStep = data.length > 10 ? Math.ceil(data.length / 7) : 1;
    el.innerHTML = data.map((d, i) => {
        const total = d.segs.reduce((s, x) => s + x.value, 0);
        const showLabel = i % labelStep === 0 || i === data.length - 1;
        let inner;
        if (total === 0 || max === 0) {
            inner = `<div class="bar-fill" style="height:3px;opacity:0.45"></div>`;
        } else {
            const visible = d.segs.filter(s => s.value > 0);
            inner = `<div class="bar-stack">` + visible.map((s, j) => {
                const pct = Math.max(Math.round(s.value / max * 100), 3);
                const isTop = j === visible.length - 1;
                const isBottom = j === 0;
                const radius = `${isTop ? '5px 5px' : '0 0'} ${isBottom ? '2px 2px' : '0 0'}`;
                return `<div style="width:100%;height:${pct}%;background:${s.color};border-radius:${radius}"></div>`;
            }).reverse().join('') + `</div>`;
        }
        return `
            <div class="bar-col" data-idx="${i}">
                ${inner}
                <span class="bar-label">${showLabel ? d.label : ''}</span>
            </div>`;
    }).join('');
}

// counts: 24 numbers (feeds per hour of day). Empty hours show a faint stub.
function renderHourlyChart(el, counts) {
    const max = Math.max(...counts, 0);
    el.innerHTML = counts.map(c => {
        if (c === 0 || max === 0) return `<div class="hbar empty" style="height:14%"></div>`;
        return `<div class="hbar" style="height:${Math.max(Math.round(c / max * 100), 10)}%"></div>`;
    }).join('');
}

// values: numbers in chronological order. Draws into an <svg viewBox="0 0 100 46">.
function renderLineChart(svg, values) {
    if (!values.length) {
        svg.innerHTML = '';
        return;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = (max - min) || 1;
    const pad = span * 0.12;
    const lo = min - pad;
    const hi = max + pad;
    const y = v => (44 - ((v - lo) / (hi - lo)) * 38 - 3).toFixed(2);
    const x = i => (values.length === 1 ? 50 : (i / (values.length - 1)) * 100).toFixed(2);

    const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const dots = values.map((v, i) =>
        `<circle cx="${x(i)}" cy="${y(v)}" r="2.6" fill="var(--bg)" stroke="var(--cat)" stroke-width="2" vector-effect="non-scaling-stroke"></circle>`
    ).join('');
    svg.innerHTML = `
        <polyline fill="none" stroke="var(--cat)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" points="${points}"></polyline>
        ${dots}`;
}
