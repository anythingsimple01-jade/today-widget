(function (root) {
  const WD = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ko: ['일', '월', '화', '수', '목', '금', '토'],
    zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    es: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
  };
  const WD1 = { en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], ko: WD.ko, zh: ['日', '一', '二', '三', '四', '五', '六'], es: ['D', 'L', 'M', 'X', 'J', 'V', 'S'] };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
  const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  const str = {
    en: { today: 'Today', done: 'done', addTip: 'Add task', addPh: 'Type a task, press Enter', memo: 'Memo', memoPh: 'Jot anything down', editTip: 'Edit', del: 'Delete', pin: 'Pin to screen', history: 'History', opacity: 'Opacity', language: 'Language', openAtLogin: 'Open at login', openData: 'Open data folder', quit: 'Quit', histDesc: 'Unfinished tasks move to the next day automatically.', byDate: 'View by date', showAll: 'Show all', noRecord: 'No records for this day.', carriedIn: 'Carried over', moved: 'Moved to next day' },
    ko: { today: '오늘', done: '완료', addTip: '할 일 추가', addPh: '할 일 입력 후 Enter', memo: '메모', memoPh: '자유롭게 적어두세요', editTip: '수정', del: '삭제', pin: '화면에 고정', history: '히스토리', opacity: '투명도', language: '언어', openAtLogin: '로그인 시 실행', openData: '데이터 폴더 열기', quit: '종료', histDesc: '끝내지 못한 일은 다음 날로 자동으로 옮겨져요.', byDate: '날짜로 보기', showAll: '전체 보기', noRecord: '이 날은 기록이 없어요.', carriedIn: '전날에서 이월', moved: '다음 날로 이동' },
    zh: { today: '今天', done: '已完成', addTip: '添加待办', addPh: '输入待办后按回车', memo: '备忘', memoPh: '随手记点什么', editTip: '编辑', del: '删除', pin: '固定在屏幕上', history: '历史', opacity: '透明度', language: '语言', openAtLogin: '登录时启动', openData: '打开数据文件夹', quit: '退出', histDesc: '未完成的事项会自动移到第二天。', byDate: '按日期查看', showAll: '查看全部', noRecord: '这一天没有记录。', carriedIn: '从前一天顺延', moved: '已移到第二天' },
    es: { today: 'Hoy', done: 'hechas', addTip: 'Añadir tarea', addPh: 'Escribe una tarea y pulsa Enter', memo: 'Nota', memoPh: 'Apunta lo que quieras', editTip: 'Editar', del: 'Eliminar', pin: 'Fijar en pantalla', history: 'Historial', opacity: 'Opacidad', language: 'Idioma', openAtLogin: 'Abrir al iniciar sesión', openData: 'Abrir carpeta de datos', quit: 'Salir', histDesc: 'Las tareas sin terminar pasan al día siguiente automáticamente.', byDate: 'Ver por fecha', showAll: 'Ver todo', noRecord: 'No hay registros este día.', carriedIn: 'Del día anterior', moved: 'Pasó al día siguiente' }
  };
  const langs = [{ value: 'en', label: 'English' }, { value: 'ko', label: '한국어' }, { value: 'zh', label: '中文' }, { value: 'es', label: 'Español' }];

  const parse = k => k.split('-').map(Number);
  const dow = k => { const [y, m, d] = parse(k); return new Date(y, m - 1, d).getDay(); };
  function shortDate(m, d, lang) {
    if (lang === 'en') return MON[m - 1] + ' ' + d;
    if (lang === 'es') return d + ' ' + MES[m - 1];
    if (lang === 'zh') return m + '月' + d + '日';
    return m + '월 ' + d + '일';
  }
  function fmtDate(k, lang) {
    const [, m, d] = parse(k), w = WD[lang][dow(k)];
    return lang === 'en' || lang === 'es' ? w + ', ' + shortDate(m, d, lang) : shortDate(m, d, lang) + ' (' + w + ')';
  }
  function headDate(k, lang) { const [, m, d] = parse(k); return shortDate(m, d, lang) + ' ' + WD[lang][dow(k)]; }
  function monthTitle(y, m, lang) {
    if (lang === 'en') return MONL[m] + ' ' + y;
    if (lang === 'es') return MESL[m] + ' de ' + y;
    if (lang === 'zh') return y + '年' + (m + 1) + '月';
    return y + '년 ' + (m + 1) + '월';
  }
  const countLabel = (c, lang) => lang === 'ko' ? c + '개' : lang === 'zh' ? c + '项' : String(c);
  const slashDate = k => { const [, m, d] = parse(k); return m + '/' + d; };

  const api = { WD, WD1, str, langs, shortDate, fmtDate, headDate, monthTitle, countLabel, slashDate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.I18N = api;
})(typeof window !== 'undefined' ? window : globalThis);
