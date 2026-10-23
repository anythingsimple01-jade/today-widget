const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
let S = null, calOpen = false, sel = null, cy = 0, cm = 0;

const hasContent = d => d && ((d.todos && d.todos.length) || (d.memo && d.memo.trim()));

function entries(k, L) {
  const d = S.days[k], isToday = k === S.today;
  let ts = d.todos || [];
  if (isToday) ts = [...ts.filter(t => !t.done), ...ts.filter(t => t.done)];
  return ts.map(t => ({
    text: t.text, done: t.done,
    tag: isToday ? (t.from ? L.carriedIn : '') : (!t.done ? L.moved : (t.from ? L.carriedIn : ''))
  }));
}

function render() {
  const lang = S.settings.lang || 'en', L = I18N.str[lang];
  document.documentElement.lang = lang;
  document.title = L.history;
  $('title').textContent = L.history;
  $('desc').textContent = L.histDesc;
  $('calBtn').title = L.byDate;
  $('calBtn').classList.toggle('active', calOpen);
  $('showAll').textContent = L.showAll;

  $('cal').hidden = !calOpen;
  $('list').hidden = calOpen;
  $('filter').hidden = calOpen || !sel;

  if (calOpen) return renderCal(lang);

  if (sel) { const [, m, d] = sel.split('-').map(Number); $('filterLabel').textContent = I18N.shortDate(m, d, lang); }
  const keys = Object.keys(S.days).filter(k => k === S.today || hasContent(S.days[k])).sort().reverse();
  const shown = sel ? keys.filter(k => k === sel) : keys;
  const list = $('list');
  list.innerHTML = '';
  if (!shown.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = L.noRecord; list.append(e); return; }
  for (const k of shown) {
    const day = document.createElement('div'); day.className = 'day';
    const dl = document.createElement('div'); dl.className = 'dl';
    dl.textContent = I18N.fmtDate(k, lang) + (k === S.today ? ' · ' + L.today : '');
    day.append(dl);
    for (const en of entries(k, L)) {
      const r = document.createElement('div'); r.className = 'e' + (en.done ? ' done' : '');
      const cb = document.createElement('span'); cb.className = 'cb' + (en.done ? ' on' : ''); cb.innerHTML = en.done ? ICON('check', 12, 3) : '';
      const t = document.createElement('div'); t.className = 'et'; t.textContent = en.text;
      r.append(cb, t);
      if (en.tag) { const g = document.createElement('div'); g.className = 'tag'; g.textContent = en.tag; r.append(g); }
      day.append(r);
    }
    const memo = (S.days[k].memo || '').trim();
    if (memo) {
      const m = document.createElement('div'); m.className = 'memo';
      m.innerHTML = '<div class="mh">' + ICON('notebook', 12) + '<span></span></div><div class="mt"></div>';
      m.querySelector('.mh span').textContent = L.memo;
      m.querySelector('.mt').textContent = S.days[k].memo;
      day.append(m);
    }
    list.append(day);
  }
}

function renderCal(lang) {
  $('month').textContent = I18N.monthTitle(cy, cm, lang);
  const g = $('grid');
  g.innerHTML = '';
  I18N.WD1[lang].forEach(w => { const e = document.createElement('div'); e.className = 'wd'; e.textContent = w; g.append(e); });
  const first = new Date(cy, cm, 1).getDay(), n = new Date(cy, cm + 1, 0).getDate();
  for (let i = 0; i < first; i++) g.append(document.createElement('div'));
  for (let d = 1; d <= n; d++) {
    const k = cy + '-' + pad(cm + 1) + '-' + pad(d);
    const day = S.days[k], c = day && day.todos ? day.todos.length : 0;
    const has = c > 0 || hasContent(day);
    const cell = document.createElement('div');
    cell.className = 'cell' + (has ? ' has' : '') + (k === S.today ? ' today' : '') + (k === sel ? ' sel' : '');
    cell.innerHTML = '<div class="n">' + d + '</div><div class="c">' + (c ? I18N.countLabel(c, lang) : '') + '</div>';
    if (has) cell.onclick = () => { sel = k; calOpen = false; render(); };
    g.append(cell);
  }
}

(async () => {
  S = await window.api.getState();
  const [y, m] = S.today.split('-').map(Number);
  cy = y; cm = m - 1;
  $('calBtn').innerHTML = ICON('calendar', 15);
  $('prev').innerHTML = ICON('left', 14);
  $('next').innerHTML = ICON('right', 14);
  $('calBtn').onclick = () => { calOpen = !calOpen; render(); };
  $('prev').onclick = () => { if (cm === 0) { cm = 11; cy--; } else cm--; render(); };
  $('next').onclick = () => { if (cm === 11) { cm = 0; cy++; } else cm++; render(); };
  $('showAll').onclick = () => { sel = null; render(); };
  render();
  window.api.onState(s => { S = s; render(); });
})();
