if (!window.api) {
  (function () {
    const KEY = 'today-widget-dev';
    const pad = n => String(n).padStart(2, '0');
    const d = new Date(), today = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const y = new Date(d); y.setDate(d.getDate() - 1);
    const yk = y.getFullYear() + '-' + pad(y.getMonth() + 1) + '-' + pad(y.getDate());
    let s = JSON.parse(localStorage.getItem(KEY) || 'null') || {
      settings: { pinned: true, opacity: 1, lang: 'en', collapsed: false },
      days: {
        [yk]: { todos: [{ id: 'a', text: 'Reply to quote', done: true }, { id: 'b', text: 'Pick up dry cleaning', done: false }], memo: 'Double-check quote amount.' },
        [today]: { todos: [{ id: 'c', text: 'Pick up dry cleaning', done: false, from: yk }, { id: 'd', text: 'Send weekly report draft', done: true }, { id: 'e', text: 'Sort design review feedback and share next week’s plan', done: false }, { id: 'f', text: 'Team meeting at 3 PM', done: false }, { id: 'g', text: 'Work out 30 min', done: false }], memo: '' }
      }
    };
    const subs = [];
    const emit = () => { localStorage.setItem(KEY, JSON.stringify(s)); const st = { today, ...JSON.parse(JSON.stringify(s)) }; subs.forEach(f => f(st)); };
    window.api = {
      getState: async () => ({ today, ...JSON.parse(JSON.stringify(s)) }),
      saveToday: v => { s.days[today] = v; emit(); },
      setSetting: (k, v) => { s.settings[k] = v; emit(); },
      resize: () => {},
      onState: f => subs.push(f)
    };
  })();
}
