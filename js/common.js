// M1 Detailing — общие скрипты для всех страниц

// защита от встраивания сайта в чужую страницу (кликджекинг)
if (window.top !== window.self) {
  try { window.top.location.replace(window.location.href); } catch (e) { document.documentElement.style.display = 'none'; }
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const bgParticles = document.getElementById('bgParticles');
const particleCount = reduceMotion ? 0 : (window.innerWidth < 768 ? 24 : 50);
const particleFrag = document.createDocumentFragment();
for (let i = 0; i < particleCount; i++) {
  const p = document.createElement('div');
  p.className = 'bg-particle';
  p.style.left = Math.random() * 100 + '%';
  p.style.animationDuration = (10 + Math.random() * 16) + 's';
  p.style.animationDelay = (Math.random() * 15) + 's';
  p.style.opacity = 0.15 + Math.random() * 0.5;
  if (Math.random() > 0.75) { p.style.width = '3px'; p.style.height = '3px'; }
  particleFrag.appendChild(p);
}
bgParticles.appendChild(particleFrag);

const observer = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
// на внутренних страницах карточки появляются плавно, по очереди
if (!reduceMotion) {
  document.querySelectorAll('main.page .ps .ring, main.page .pc-card, main.page .pt-wrap, main.page .wk-card, main.page .faq-item, main.page .pc-highlights, main.page .ps-head')
    .forEach(el => { if (!el.closest('.reveal')) el.classList.add('reveal'); });
}
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ===== «Частые вопросы»: раскрываются по нажатию (без скрипта — просто открыты) =====
document.querySelectorAll('.faq-list').forEach(list => {
  list.querySelectorAll('.faq-item').forEach((item, i) => {
    const h = item.querySelector('h3');
    if (!h) return;
    const id = 'faq-' + Math.random().toString(36).slice(2, 8);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'faq-q';
    btn.setAttribute('aria-controls', id);
    btn.innerHTML = '<span></span><i class="faq-ico" aria-hidden="true"></i>';
    btn.firstChild.textContent = h.textContent;
    h.textContent = '';
    h.appendChild(btn);
    const wrap = document.createElement('div');
    wrap.className = 'faq-a';
    wrap.id = id;
    const inner = document.createElement('div');
    while (h.nextSibling) inner.appendChild(h.nextSibling);
    wrap.appendChild(inner);
    item.appendChild(wrap);
    item.classList.add('faq-js');
    const set = open => { item.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    set(i === 0);                                   // первый вопрос открыт
    btn.addEventListener('click', () => set(!item.classList.contains('open')));
  });
});

const statObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = +el.dataset.target;
      const suf = el.dataset.suffix || '';          // знак после числа: %, +, лет…
      statObserver.unobserve(el);
      if (reduceMotion) { el.textContent = target + suf; return; }
      const t0 = performance.now(), dur = 1500;
      const tick = now => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = Math.floor(target * k) + suf;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-num').forEach(el => statObserver.observe(el));

// логотип: на главной — плавно наверх, на других страницах — обычная ссылка на главную
(function () {
  const logoLink = document.getElementById('logoLink');
  if (logoLink && document.body.dataset.page === 'home') {
    logoLink.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
})();


const toTop = document.getElementById('toTop');
// прячем кнопку «наверх» на телефоне, пока видна форма записи
(function () {
  const forms = ['bookingForm'].map(id => document.getElementById(id)).filter(Boolean);
  const seen = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
    document.body.classList.toggle('form-in-view', seen.size > 0);
  }, { threshold: 0.05 });
  forms.forEach(f => io.observe(f));
})();

let toTopQueued = false;
window.addEventListener('scroll', () => {
  if (toTopQueued) return;
  toTopQueued = true;
  requestAnimationFrame(() => { toTop.classList.toggle('show', window.scrollY > 600); toTopQueued = false; });
}, { passive: true });
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ===== Мобильное меню =====
(function () {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('mainNav');
  if (!burger || !nav) return;
  const isOpen = () => nav.classList.contains('open');
  function setOpen(o) {
    nav.classList.toggle('open', o);
    burger.classList.toggle('open', o);
    burger.setAttribute('aria-expanded', o);
    document.body.classList.toggle('nav-lock', o);   // страница под открытым меню не листается
  }
  burger.addEventListener('click', () => setOpen(!isOpen()));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  window.addEventListener('resize', () => { if (innerWidth > 768 && isOpen()) setOpen(false); });
  // нажатие мимо меню — закрыть
  document.addEventListener('click', e => {
    if (isOpen() && !nav.contains(e.target) && !burger.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    burger.focus();   // фокус — обратно на кнопку меню
  });
})();

// ===== Заявки: куда отправлять =====
// Приёмник заявок (api/lead.php на том же сайте). Заявки видны в админке на вкладке «Заявки».
const BOOKING_URL = '/api/lead.php';

// ===== Защита форм: антибот, лимит отправок, очистка текста, фильтр мата =====
// Важно: это защита на стороне браузера. Она отсекает простых ботов и случайный спам,
// но не заменяет проверку на сервере (admin/api/lead.php).
const FormGuard = (function () {
  const HOUR = 3600000;
  const mem = {};
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return mem[k] || []; } }
  function save(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* приватный режим */ } }

  // следим, что форму заполняет живой человек (настоящие касания/нажатия)
  function watch(form) {
    const st = { start: 0, human: false, lastTry: 0 };
    const mark = e => {
      if (!e.isTrusted) return;
      if (!st.start) st.start = Date.now();
      if (e.type !== 'input' && e.type !== 'change') st.human = true;
    };
    ['pointerdown', 'touchstart', 'keydown', 'input', 'change'].forEach(ev =>
      form.addEventListener(ev, mark, { passive: true, capture: true }));
    return st;
  }

  // { type: 'bot' } | { type: 'fast' } | { type: 'wait', sec } | null (можно отправлять)
  function check(st, key, opt) {
    if (navigator.webdriver || !st.human) return { type: 'bot' };
    const now = Date.now();
    if (!st.start || now - st.start < opt.minFillMs) return { type: 'fast' };
    const list = load(key).filter(t => now - t < HOUR);
    const last = list[list.length - 1];
    if (last && now - last < opt.cooldownMs) return { type: 'wait', sec: Math.ceil((opt.cooldownMs - (now - last)) / 1000) };
    if (list.length >= opt.perHour) return { type: 'wait', sec: Math.ceil((HOUR - (now - list[0])) / 1000) };
    if (now - st.lastTry < 10000) return { type: 'retry', sec: Math.ceil((10000 - (now - st.lastTry)) / 1000) };
    return null;
  }
  const markTry = st => { st.lastTry = Date.now(); };
  function record(key) {
    const now = Date.now();
    const list = load(key).filter(t => now - t < HOUR);
    list.push(now);
    save(key, list);
  }
  function waitText(sec) {
    if (sec < 60) return sec + ' сек.';
    const m = Math.ceil(sec / 60);
    return m + ' мин.';
  }

  // очистка текста: невидимые символы, лишние пробелы, «формулы» для Google-таблицы
  function clean(s, multiline) {
    s = String(s || '').normalize('NFKC')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F­​-‏‪-‮⁠-⁤﻿]/g, '');
    s = multiline
      ? s.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
      : s.replace(/\s+/g, ' ');
    return s.trim().replace(/^[=+\-@\s]+/, '');
  }
  const hasLink = s => /(https?:\/\/|www\.|t\.me\/|\b[a-z0-9-]{2,}\.(ru|su|com|net|org|info|biz|xyz|top|io|me|online|site|рф)\b)/i.test(s);

  // ---------- фильтр мата (русский + английский, с обходами) ----------
  const LAT2CYR = { a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', n: 'п', o: 'о', p: 'р', r: 'г', t: 'т', x: 'х', y: 'у', u: 'у',
    '0': 'о', '3': 'з', '4': 'ч', '6': 'б', '@': 'а', '$': 'с' };
  const CYR2LAT = { 'а': 'a', 'в': 'b', 'с': 'c', 'е': 'e', 'н': 'h', 'к': 'k', 'м': 'm', 'о': 'o', 'р': 'p', 'т': 't', 'х': 'x', 'у': 'y',
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i', '|': 'i' };
  const TR2 = [['shch', 'щ'], ['sch', 'щ'], ['yo', 'е'], ['jo', 'е'], ['zh', 'ж'], ['kh', 'х'], ['ch', 'ч'], ['sh', 'ш'], ['ts', 'ц'],
    ['ya', 'я'], ['ja', 'я'], ['yu', 'ю'], ['ju', 'ю'], ['ye', 'е']];
  const TR1 = { a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', z: 'з', i: 'и', j: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п',
    r: 'р', s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х', x: 'х', c: 'к', y: 'й', w: 'в', q: 'к', '0': 'о', '3': 'з', '4': 'ч', '6': 'б', '@': 'а' };

  const RU = [
    /^(?:по|на|ни|за|от|до|о|а|у|с|в|под|про|при|пере|рас|раз|вы|об|недо|долбо|мудо|зло)?ху[йяеиюё]/,
    /п[ие]зд/,
    /^(?:за|по|на|от|вы|у|раз|рас|разъ|до|об|объ|под|подъ|въ|съ|о|из|изъ|пере|при|вз|недо|долбо|хуе|ни|отъ|про|сь)?еб(?:[аеиоуыюялнт]|$)/,
    /^бля/, /бляд/,
    /^сук(?:а|и|е|у|ой|ам|ами|ах|ин|ина|ины|ину|иным)$/, /^сучк/, /^сучар/,
    /^муд(?:ак|ач|ил|ло|озвон)/,
    /^пид[оае]?р/, /п[иеэ]д[оа]рас/,
    /г[ао]ндон/, /залуп/, /шлюх/, /дроч/, /^шалав/,
    /^манд(?:а|у|е|ы|ой|ою|ец|авошк[аиу])$/,
    /^(?:на|по|ни)?хер(?:а|ня|ни|ню|ней|ов|ова|ово|овы|ачить)?$/,
    /^жоп/
  ];
  const EN = [
    /f+u*c+k|^fuk|^fck|phuck|^fuq/, /shit/, /bitch/, /cunt/, /nigg[ae]/, /asshole|arsehole/, /^motherf/,
    /^dick(?:s|head)?$/, /^cock(?:s|sucker)?$/, /^(?:ass|asses|arse|jackass|dumbass)$/, /^bastard/, /^whore/,
    /^slut/, /^fag(?:s|got|gots)?$/, /^puss(?:y|ies)$/, /^wank/, /^twat/, /^cum$/, /^dildo/
  ];

  const mapChars = (s, map) => s.split('').map(ch => map[ch] || ch).join('');
  function translit(s) {
    TR2.forEach(([a, b]) => { s = s.split(a).join(b); });
    return mapChars(s, TR1);
  }
  const collapse = s => s.replace(/(.)\1+/g, '$1');

  function testWord(tok) {
    if (!tok) return false;
    let bases = [tok];
    const masks = (tok.match(/[*#%]/g) || []).length;
    if (masks && masks <= 3) {
      bases = ['у', 'и', 'е', 'а', 'о', 'я', 'ы', 'х', 'б', 'л', 'з', 'с', 'д', 'й', 'к', 'u', 'i', 'a', 'e', 'o'].map(f => tok.replace(/[*#%]/g, f));
    }
    for (const b of bases) {
      const ru = [mapChars(b, LAT2CYR), translit(b)].map(v => v.replace(/[^а-яё]/g, '').replace(/ё/g, 'е'));
      for (const v of ru) for (const w of [v, collapse(v)]) if (w && RU.some(r => r.test(w))) return true;
      const en = mapChars(b, CYR2LAT).replace(/[^a-z]/g, '');
      for (const w of [en, collapse(en)]) if (w && EN.some(r => r.test(w))) return true;
    }
    return false;
  }

  function hasBadWords(text) {
    const s = clean(text, false).toLowerCase().replace(/ё/g, 'е');
    if (!s) return false;
    const raw = s.split(' ');
    const words = [];
    let run = '';
    raw.forEach(t => {
      const letters = t.replace(/[^a-zа-я0-9*#%@$!|]/g, '');
      // «х у й», «f u c k» — склеиваем подряд идущие одиночные буквы
      if (letters.length === 1) { run += letters; return; }
      if (run.length > 1) words.push(run);
      run = '';
      words.push(letters);                                  // «х.у.й» → «хуй»
      t.split(/[^a-zа-я0-9*#%@$!|]+/).forEach(p => { if (p && p !== letters) words.push(p); }); // «привет,бля»
    });
    if (run.length > 1) words.push(run);
    return words.some(testWord);
  }

  return { watch, check, markTry, record, waitText, clean, hasLink, hasBadWords };
})();

// ===== Окна «Рассчитать стоимость» и «Обратная связь» =====
(function () {
  const PHONE_TEL = '+79032444222';
  const PHONE_TXT = '+7 903 244-42-22';
  const SEND_URL = (typeof BOOKING_URL !== 'undefined') ? BOOKING_URL : '';
  const G = (typeof FormGuard !== 'undefined') ? FormGuard : null;
  const CALL = '<a href="tel:' + PHONE_TEL + '">' + PHONE_TXT + '</a>';

  // телефон в любом формате -> +7 (XXX) XXX-XX-XX; пустая строка, если цифр не хватает
  function normPhone(v) {
    let d = String(v).replace(/\D/g, '');
    if (d.length === 11 && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
    if (d.length !== 10) return '';
    if (!/^[3489]/.test(d)) return '';   // российские коды начинаются с 3, 4, 8 или 9 — «1234567890» не номер
    return '+7 (' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6, 8) + '-' + d.slice(8, 10);
  }

  function setupForm(form, kind, opts) {
    if (!form) return;
    const status = form.querySelector('.lead-status');
    const btn = form.querySelector('.lead-submit');
    const guard = G ? G.watch(form) : null;
    let sending = false;
    const clean = (v, multi) => G ? G.clean(v, multi) : String(v).trim();
    const show = (type, html) => { status.className = 'lead-status ' + type; status.innerHTML = html; };
    const bad = (el, text) => {
      show('err', text);
      el.classList.add('is-err');
      el.focus();
      el.addEventListener('input', () => el.classList.remove('is-err'), { once: true });
    };
    const done = phone => {
      show('ok', 'Спасибо! Заявка отправлена. Перезвоним' + (phone ? ' по номеру ' + phone : '') + ' в течение 15 минут.');
      form.reset();
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (sending) return;
      const f = form.elements;
      if (f['website'] && f['website'].value) { done(''); return; }   // ловушка для ботов

      const name = clean(f['name'].value).slice(0, 60);
      const phone = normPhone(f['phone'].value);
      const car = f['car'] ? clean(f['car'].value).slice(0, 60) : '';
      const service = f['service'] ? f['service'].value : '';
      const comment = f['comment'] ? clean(f['comment'].value, true).slice(0, 500) : '';

      if ((opts.nameRequired || name) && !/^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё '’.-]{1,59}$/.test(name)) return bad(f['name'], 'Укажите имя буквами (минимум 2 буквы).');
      if (!phone) return bad(f['phone'], 'Введите номер телефона полностью, например +7 900 000-00-00.');
      if (G) {
        for (const k of ['car', 'comment']) { const v = k === 'car' ? car : comment; if (v && G.hasLink(v)) return bad(f[k], 'Пожалуйста, без ссылок.'); }
        for (const [k, v] of [['name', name], ['car', car], ['comment', comment]]) { if (v && f[k] && G.hasBadWords(v)) return bad(f[k], 'Пожалуйста, без нецензурных слов.'); }
      }
      if (f['consent'] && !f['consent'].checked) { show('err', 'Отметьте согласие на обработку персональных данных.'); f['consent'].focus(); return; }

      if (G && guard) {
        const v = G.check(guard, 'm1_' + kind, { minFillMs: 2500, cooldownMs: 60000, perHour: 3 });
        if (v && v.type === 'bot') { done(''); return; }
        if (v && v.type === 'fast') { show('err', 'Проверьте данные и нажмите «Отправить» ещё раз.'); return; }
        if (v && v.type === 'retry') { show('err', 'Подождите ' + G.waitText(v.sec) + ' и попробуйте снова.'); return; }
        if (v && v.type === 'wait') { show('err', 'Заявка уже отправлена. Новую можно отправить через ' + G.waitText(v.sec) + ' Если срочно — позвоните: ' + CALL); return; }
      }
      if (!SEND_URL) { show('err', 'Форма пока не подключена. Позвоните нам: ' + CALL); return; }

      const data = { form: opts.label, name: name, phone: phone, service: service, date: '', time: '', car: car, comment: comment, consent: true, page: location.origin + location.pathname };
      sending = true; if (G && guard) G.markTry(guard);
      btn.disabled = true; const label = btn.textContent; btn.textContent = 'Отправляем…';
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 15000);
        const res = await fetch(SEND_URL, { method: 'POST', body: JSON.stringify(data), signal: ctrl.signal });
        clearTimeout(to);
        const out = await res.json();
        if (!out.ok) throw new Error(out.error || 'server');
        if (G) G.record('m1_' + kind);
        done(phone);
      } catch (err) {
        show('err', 'Не получилось отправить заявку. Позвоните нам: ' + CALL);
      } finally {
        sending = false; btn.disabled = false; btn.textContent = label;
      }
    });
  }

  setupForm(document.getElementById('calcForm'), 'calc', { label: 'Расчёт стоимости', nameRequired: false });
  setupForm(document.getElementById('cbForm'), 'callback', { label: 'Обратная связь', nameRequired: true });

  // --- окно расчёта
  const modal = document.getElementById('calcModal');
  let lastFocus = null;
  // прошлое «Спасибо!» или ошибка не должны висеть при новом открытии окна
  const clearStatus = box => { const s = box && box.querySelector('.lead-status'); if (s) { s.className = 'lead-status'; s.textContent = ''; } };
  function openCalc() {
    closeCb();
    clearStatus(modal);
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('lead-lock');
    setTimeout(() => { const ph = document.getElementById('calcPhone'); if (ph) ph.focus(); }, 60);
  }
  function closeCalc() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('lead-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  // фокус не уходит из окна по Tab
  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const items = [...modal.querySelectorAll('button, a[href], input:not(.hp-field), select, textarea, summary')].filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // если фокус всё же ушёл на страницу позади окна (щелчок по тексту, Tab с пустого места) — возвращаем в окно
  document.addEventListener('focusin', e => {
    if (modal.hidden || modal.contains(e.target)) return;
    const ph = document.getElementById('calcPhone') || modal.querySelector('input:not(.hp-field), button');
    if (ph) ph.focus();
  });

  // --- панель обратной связи
  const cbWidget = document.getElementById('cbWidget');
  const cbPanel = document.getElementById('cbPanel');
  const cbToggle = document.getElementById('cbToggle');
  function openCb() {
    clearStatus(cbPanel);
    cbPanel.hidden = false; cbWidget.classList.add('open'); cbToggle.setAttribute('aria-expanded', 'true');
    setTimeout(() => { const n = document.getElementById('cbName'); if (n) n.focus(); }, 60);
  }
  function closeCb() {
    if (!cbPanel || cbPanel.hidden) return;
    cbPanel.hidden = true; cbWidget.classList.remove('open'); cbToggle.setAttribute('aria-expanded', 'false');
  }
  cbToggle.addEventListener('click', e => { e.stopPropagation(); cbPanel.hidden ? openCb() : closeCb(); });

  document.addEventListener('click', e => {
    if (e.target.closest('[data-open="calc"]')) { e.preventDefault(); openCalc(); return; }
    if (e.target.closest('[data-close="calc"]')) { closeCalc(); return; }
    if (e.target.closest('[data-close="cb"]')) { closeCb(); cbToggle.focus(); return; }
    if (!cbPanel.hidden && !e.target.closest('#cbWidget')) closeCb();
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const cbOpen = !cbPanel.hidden;
    closeCalc(); closeCb();
    if (cbOpen) cbToggle.focus();   // фокус — обратно на кнопку, которая открыла панель
  });
})();

// ===== Выпадающее меню «Услуги» =====
(function () {
  const dd = document.getElementById('navServices');
  if (!dd) return;
  const btn = dd.querySelector('.nav-dd-btn');
  const set = o => { dd.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
  btn.addEventListener('click', e => { e.stopPropagation(); set(!dd.classList.contains('open')); });
  dd.querySelectorAll('.nav-dd-menu a').forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('click', e => { if (!dd.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
})();

// ===== Меню: подсветка пункта текущей страницы =====
(function () {
  const here = location.pathname.replace(/index\.html$/, '');
  // ссылка без адреса не должна ломать остальные скрипты страницы
  document.querySelectorAll('#mainNav > a[href]').forEach(a => {
    const u = new URL(a.getAttribute('href'), location.href);
    if (!u.hash && u.pathname.replace(/index\.html$/, '') === here) a.classList.add('is-active');
  });
  // страница услуги из списка «Услуги»: подсвечиваем пункт в списке и саму кнопку «Услуги»
  document.querySelectorAll('.nav-dd-menu a[href]').forEach(a => {
    const u = new URL(a.getAttribute('href'), location.href);
    if (!u.hash && u.pathname.replace(/index\.html$/, '') === here) {
      a.classList.add('is-active');
      const btn = document.querySelector('.nav-dd-btn');
      if (btn) btn.classList.add('is-active');
    }
  });
})();

// ===== Панель внизу экрана: прячем, пока человек печатает (клавиатура телефона) =====
document.addEventListener('focusin', e => {
  if (e.target.matches('input:not([type=checkbox]):not([type=radio]), textarea, select')) document.body.classList.add('typing');
});
document.addEventListener('focusout', () => {
  setTimeout(() => {
    const a = document.activeElement;
    if (!a || !a.matches('input:not([type=checkbox]):not([type=radio]), textarea, select')) document.body.classList.remove('typing');
  }, 60);
});

// ===== Кнопки с data-open="cb" (например, в шапке) открывают «Обратную связь» =====
document.addEventListener('click', e => {
  const b = e.target.closest('[data-open="cb"]');
  if (!b) return;
  e.preventDefault();
  e.stopPropagation();          // чтобы панель сразу не закрылась «кликом снаружи»
  const toggle = document.getElementById('cbToggle');
  const panel = document.getElementById('cbPanel');
  if (toggle && panel && panel.hidden) toggle.click();
}, true);

// ---------- Просмотр фото и видео крупно (работы, примеры на страницах услуг) ----------
// Любая кнопка .wk-slide открывает окно; листаются соседние кнопки из того же блока.
(function () {
  if (!document.querySelector('.wk-slide')) return;
  var box = document.getElementById('wkBox');
  if (!box) {
    box = document.createElement('div');
    box.className = 'wk-box'; box.id = 'wkBox'; box.hidden = true;
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Просмотр фото');
    box.innerHTML = '<button type="button" class="wk-box-x" aria-label="Закрыть">✕</button>' +
      '<button type="button" class="wk-box-nav wk-box-prev" aria-label="Предыдущее">‹</button><img alt="">' +
      '<video controls playsinline hidden></video>' +
      '<button type="button" class="wk-box-nav wk-box-next" aria-label="Следующее">›</button><span class="wk-box-count"></span>';
    document.body.appendChild(box);
  }
  var img = box.querySelector('img'), vid = box.querySelector('video'), cnt = box.querySelector('.wk-box-count');
  var prev = box.querySelector('.wk-box-prev'), next = box.querySelector('.wk-box-next');
  var list = [], pos = 0, lastFocus = null;

  function show(i) {
    pos = (i + list.length) % list.length;
    var s = list[pos], isVideo = s.getAttribute('data-type') === 'video';
    vid.pause();
    img.hidden = isVideo; vid.hidden = !isVideo;
    if (isVideo) { img.removeAttribute('src'); vid.src = s.getAttribute('data-full'); vid.play().catch(function () {}); }
    else { vid.removeAttribute('src'); img.src = s.getAttribute('data-full'); var p = s.querySelector('img'); img.alt = p ? p.alt : ''; }
    var many = list.length > 1;
    prev.hidden = next.hidden = !many;
    cnt.textContent = many ? (pos + 1) + ' / ' + list.length : '';
  }
  function close() {
    box.hidden = true; vid.pause(); vid.removeAttribute('src'); img.removeAttribute('src');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  // пока открыт просмотр, фокус клавиатуры не уходит на страницу позади
  document.addEventListener('focusin', function (e) {
    if (!box.hidden && !box.contains(e.target)) box.querySelector('.wk-box-x').focus();
  });
  box.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var items = Array.prototype.filter.call(box.querySelectorAll('button'), function (b) { return !b.hidden; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.wk-slide');
    if (!btn || box.contains(btn)) return;
    list = Array.prototype.filter.call(btn.parentNode.children, function (el) { return el.classList.contains('wk-slide'); });
    lastFocus = btn;
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    show(list.indexOf(btn));
    box.querySelector('.wk-box-x').focus();
  });
  prev.addEventListener('click', function (e) { e.stopPropagation(); show(pos - 1); });
  next.addEventListener('click', function (e) { e.stopPropagation(); show(pos + 1); });
  box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('wk-box-x')) close(); });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft' && list.length > 1) show(pos - 1);
    else if (e.key === 'ArrowRight' && list.length > 1) show(pos + 1);
  });
  var x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (x0 === null || list.length < 2) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(pos + (dx < 0 ? 1 : -1));
  });
})();
