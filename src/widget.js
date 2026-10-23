const $ = id => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const composing = e => e.isComposing || e.keyCode === 229;

let S = null, todos = [], memo = '', lang = 'en', collapsed = false;
let adding = false, memoOpen = false, editingId = null, memoTimer = null;

const persist = () => window.api.saveToday({ todos, memo });

function applyState(s) {
  const dayChanged = !S || S.today !== s.today;
  S = s;
  lang = s.settings.lang || 'en';
  collapsed = !!s.settings.collapsed;
  if (editingId && !dayChanged) { render(true); return; }
  const d = s.days[s.today] || { todos: [], memo: '' };
  todos = d.todos.map(t => ({ ...t }));
  if (dayChanged || document.activeElement !== $('memoText')) memo = d.memo || '';
  render();
}

function render(headerOnly) {
  const L = I18N.str[lang];
  document.documentElement.lang = lang;
  $('date').textContent = I18N.headDate(S.today, lang);
  const done = todos.filter(t => t.done).length;
  $('count').textContent = done + '/' + todos.length;
  $('fill').style.width = (todos.length ? done / todos.length * 100 : 0) + '%';
  $('addBtn').title = L.addTip; $('addBtn').classList.toggle('active', adding);
  $('memoBtn').title = L.memo; $('memoBtn').classList.toggle('active', memoOpen);
  $('body').hidden = collapsed;
  $('addRow').hidden = !adding;
  $('addInput').placeholder = L.addPh;
  $('memoCard').hidden = !memoOpen;
  $('memoTitle').textContent = L.memo;
  $('memoText').placeholder = L.memoPh;
  if (document.activeElement !== $('memoText')) $('memoText').value = memo;
  if (!headerOnly) renderList(L);
  fit();
}

function fit() { requestAnimationFrame(() => window.api.resize($('wrap').getBoundingClientRect().height)); }

function renderList(L) {
  const list = $('list');
  list.innerHTML = '';
  const sorted = [...todos.filter(t => !t.done), ...todos.filter(t => t.done)];
  for (const t of sorted) {
    const row = document.createElement('div');
    row.className = 'item' + (t.done ? ' done' : '');
    row.draggable = true;
    row.dataset.id = t.id;

    const cb = document.createElement('div');
    cb.className = 'cb' + (t.done ? ' on' : '');
    cb.innerHTML = t.done ? ICON('check', 12, 3) : '';
    cb.onclick = () => toggle(t.id);

    const tx = document.createElement('div');
    tx.className = 'text';
    tx.title = t.text;
    const sp = document.createElement('span');
    sp.textContent = t.text;
    tx.appendChild(sp);
    tx.onclick = () => toggle(t.id);

    row.append(cb, tx);
    if (t.from) { const f = document.createElement('div'); f.className = 'from'; f.textContent = I18N.slashDate(t.from); row.append(f); }

    const tools = document.createElement('div');
    tools.className = 'tools';
    const eb = document.createElement('button'); eb.className = 'tool'; eb.title = L.editTip; eb.innerHTML = ICON('pencil', 12);
    eb.onclick = e => { e.stopPropagation(); startEdit(t, row, tx); };
    const db = document.createElement('button'); db.className = 'tool'; db.title = L.del; db.innerHTML = ICON('x', 12);
    db.onclick = e => { e.stopPropagation(); todos = todos.filter(x => x.id !== t.id); persist(); render(); };
    tools.append(eb, db);
    row.append(tools);

    // long text: slide to reveal on hover
    row.addEventListener('mouseenter', () => {
      const o = tx.scrollWidth - tx.clientWidth;
      if (o <= 0) return;
      const shift = o + 52;
      tx.classList.add('marq');
      void tx.offsetWidth;
      sp.style.transition = 'transform ' + Math.max(600, shift * 25) + 'ms linear 300ms';
      sp.style.transform = 'translateX(' + -shift + 'px)';
    });
    row.addEventListener('mouseleave', () => {
      sp.style.transition = 'transform 150ms';
      sp.style.transform = 'translateX(0)';
      setTimeout(() => tx.classList.remove('marq'), 150);
    });

    // drag to reorder (within the same group: open / done)
    row.addEventListener('dragstart', e => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', t.id);
      requestAnimationFrame(() => row.classList.add('dragging'));
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      const src = list.querySelector('.dragging');
      if (!src || src === row || src.classList.contains('done') !== row.classList.contains('done')) return;
      const r = row.getBoundingClientRect();
      list.insertBefore(src, e.clientY > r.top + r.height / 2 ? row.nextSibling : row);
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      const ids = [...list.children].map(c => c.dataset.id);
      todos = ids.map(id => todos.find(x => x.id === id)).filter(Boolean);
      persist(); render();
    });

    list.append(row);
  }
}

function toggle(id) {
  todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
  persist(); render();
}

function startEdit(t, row, tx) {
  editingId = t.id;
  row.draggable = false;
  row.classList.add('editing');
  const inp = document.createElement('input');
  inp.className = 'edit';
  inp.value = t.text;
  tx.replaceWith(inp);
  inp.focus(); inp.select();
  let finished = false;
  const finish = ok => {
    if (finished) return;
    finished = true;
    editingId = null;
    const v = inp.value.trim();
    if (ok && v && v !== t.text) { todos = todos.map(x => x.id === t.id ? { ...x, text: v } : x); persist(); }
    render();
  };
  inp.onkeydown = e => { if (composing(e)) return; if (e.key === 'Enter') finish(true); else if (e.key === 'Escape') finish(false); };
  inp.onblur = () => finish(true);
  inp.onclick = e => e.stopPropagation();
}

function wire() {
  $('addBtn').innerHTML = ICON('plus', 14);
  $('memoBtn').innerHTML = ICON('notebook', 13);
  $('memoClose').innerHTML = ICON('x', 12);

  $('head').onclick = e => {
    if (e.target.closest('button')) return;
    collapsed = !collapsed;
    window.api.setSetting('collapsed', collapsed);
    render();
  };
  $('addBtn').onclick = e => {
    e.stopPropagation();
    if (collapsed) { collapsed = false; window.api.setSetting('collapsed', false); adding = true; }
    else adding = !adding;
    $('addInput').value = '';
    render();
    if (adding) $('addInput').focus();
  };
  $('addInput').onkeydown = e => {
    if (composing(e)) return;
    if (e.key === 'Escape') { adding = false; render(); return; }
    if (e.key !== 'Enter') return;
    const v = e.target.value.trim();
    if (!v) return;
    todos.push({ id: uid(), text: v, done: false });
    e.target.value = '';
    persist(); render();
  };
  $('memoBtn').onclick = e => { e.stopPropagation(); memoOpen = !memoOpen; render(); if (memoOpen) $('memoText').focus(); };
  $('memoClose').onclick = () => { memoOpen = false; persist(); render(); };
  $('memoText').oninput = e => { memo = e.target.value; clearTimeout(memoTimer); memoTimer = setTimeout(persist, 400); };
  $('memoText').onblur = () => { clearTimeout(memoTimer); persist(); };
}

(async () => {
  wire();
  applyState(await window.api.getState());
  window.api.onState(applyState);
})();
