// M1 Detailing — скрипты только для главной страницы
// ===== До/после: слайдер =====
document.querySelectorAll('.ba-slider').forEach(slider => {
  const after = slider.querySelector('.ba-after');
  const handle = slider.querySelector('.ba-handle');
  let dragging = false;
  let pos = 50;
  function apply(pct) {
    pos = Math.max(5, Math.min(95, pct));
    after.style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
    handle.style.left = pos + '%';
    handle.setAttribute('aria-valuenow', String(Math.round(pos)));
  }
  function setPos(x) {
    const rect = slider.getBoundingClientRect();
    apply(((x - rect.left) / rect.width) * 100);
  }
  // управление с клавиатуры и для экранного диктора: стрелки двигают шторку
  handle.setAttribute('role', 'slider');
  handle.setAttribute('tabindex', '0');
  handle.setAttribute('aria-label', 'Сравнить до и после');
  handle.setAttribute('aria-valuemin', '5');
  handle.setAttribute('aria-valuemax', '95');
  handle.setAttribute('aria-valuenow', '50');
  handle.addEventListener('keydown', e => {
    const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, Home: -100, End: 100 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    apply(pos + step);
  });
  slider.addEventListener('mousedown', e => { dragging = true; setPos(e.clientX); });
  window.addEventListener('mousemove', e => { if (dragging) setPos(e.clientX); });
  window.addEventListener('mouseup', () => dragging = false);
  // на телефоне: движение пальцем вбок двигает шторку, вверх-вниз — прокручивает страницу как обычно
  let x0 = 0, y0 = 0, dir = '';
  slider.addEventListener('touchstart', e => {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dir = ''; dragging = true;
  }, { passive: true });
  slider.addEventListener('touchmove', e => {
    if (!dragging) return;
    const t = e.touches[0];
    if (!dir) {
      const dx = Math.abs(t.clientX - x0), dy = Math.abs(t.clientY - y0);
      if (dx < 6 && dy < 6) return;
      dir = dx > dy ? 'x' : 'y';
    }
    if (dir === 'y') { dragging = false; return; }
    e.preventDefault();
    setPos(t.clientX);
  }, { passive: false });
  slider.addEventListener('touchend', e => {
    if (dragging && !dir && e.changedTouches[0]) setPos(e.changedTouches[0].clientX);   // просто коснулись — шторка к пальцу
    dragging = false;
  });
});
// ===== Маска телефона =====
(function () {
  const input = document.getElementById('phone');
  const ghost = document.getElementById('phoneGhost');
  const TPL = '+7 (***) ***-**-**';
  TPL.split('').forEach(ch => {
    const sp = document.createElement('span');
    sp.textContent = ch;
    ghost.appendChild(sp);
  });
  const spans = ghost.children;

  function format(raw) {
    let d = raw.replace(/\D/g, '');
    if (/^[78]/.test(d)) d = d.slice(1);
    if (d.length > 10 && /^[78]/.test(d)) d = d.slice(1);
    d = d.slice(0, 10);
    let out = '+7';
    if (d.length > 0) out += ' (' + d.slice(0, 3);
    if (d.length > 3) out += ') ' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 8);
    if (d.length > 8) out += '-' + d.slice(8, 10);
    return out;
  }

  function render() {
    const v = input.value;
    for (let i = 0; i < spans.length; i++) {
      if (i < v.length) {
        spans[i].textContent = v[i];
        spans[i].classList.add('gone');
      } else {
        spans[i].textContent = TPL[i];
        spans[i].classList.remove('gone');
      }
    }
  }

  input.addEventListener('keydown', e => {
    if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
    }
  });

  input.addEventListener('input', e => {
    const raw = input.value;
    const pos = input.selectionStart;
    const atEnd = pos >= raw.length;
    const cnt = (raw.slice(0, pos).match(/\d/g) || []).length;
    const f = format(raw);
    input.value = f;
    let np = f.length;
    if (!atEnd && e.inputType !== 'insertFromPaste') {
      let c = 0; np = 0;
      while (np < f.length && c < cnt) { if (/\d/.test(f[np])) c++; np++; }
      np = Math.max(np, 2);
    }
    input.setSelectionRange(np, np);
    render();
  });

  ['focus', 'click', 'keyup'].forEach(ev => {
    input.addEventListener(ev, () => {
      if (input.selectionStart === input.selectionEnd && input.selectionStart < 2) {
        input.setSelectionRange(2, 2);
      }
    });
  });

  input.form.addEventListener('reset', () => {
    setTimeout(() => { input.value = '+7'; render(); }, 0);
  });

  input.value = format(input.value);
  render();
})();
(function () {
  const form = document.getElementById('bookingForm');
  const dateEl = document.getElementById('bkDate');
  const timeEl = document.getElementById('bkTime');
  const btn = document.getElementById('bkSubmit');
  const status = document.getElementById('bkStatus');
  const guard = FormGuard.watch(form);
  let sending = false;

  // даты: от сегодня до +60 дней (по местному времени)
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  // пересчитываем при каждом выборе даты: вкладка могла быть открыта со вчерашнего дня
  function setRange() {
    const today = new Date();
    const max = new Date(); max.setDate(max.getDate() + 60);
    dateEl.min = iso(today); dateEl.max = iso(max);
  }
  setRange();
  ['focus', 'pointerdown'].forEach(ev => dateEl.addEventListener(ev, setRange));

  // время: 11:00–22:00 (работаем до 23:00)
  const HOURS = [];
  for (let h = 11; h <= 22; h++) HOURS.push(String(h).padStart(2, '0') + ':00');
  timeEl.innerHTML = '<option value="">Выберите время</option>';
  HOURS.forEach(t => { const o = document.createElement('option'); o.textContent = t; timeEl.appendChild(o); });

  // на сегодня прошедшие часы недоступны
  function refreshHours() {
    const isToday = dateEl.value === iso(new Date());
    const nowH = new Date().getHours();
    [...timeEl.options].forEach(o => { if (o.value) o.disabled = isToday && +o.value.slice(0, 2) <= nowH; });
    if (timeEl.selectedOptions[0] && timeEl.selectedOptions[0].disabled) timeEl.value = '';
  }
  dateEl.addEventListener('change', refreshHours);
  timeEl.addEventListener('focus', refreshHours);
  form.addEventListener('reset', () => setTimeout(refreshHours, 0));

  const SERVICES = [...form.elements['service'].options].map(o => o.value).filter(Boolean);

  function show(type, html) {
    status.className = 'form-status show ' + type;
    status.innerHTML = html;
  }
  function bad(field, text) {
    show('err', text);
    field.classList.add('bk-field-err');
    field.focus();
    field.addEventListener('input', () => field.classList.remove('bk-field-err'), { once: true });
  }
  function done(phone) {
    show('ok', 'Заявка отправлена! Мы свяжемся с вами' + (phone ? ' по номеру ' + phone.replace(/[^\d+() -]/g, '') : '') + ' и подтвердим время.');
    form.reset();
    document.getElementById('phone').dispatchEvent(new Event('input'));
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending) return;
    setRange(); refreshHours();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const f = form.elements;

    // ловушки для ботов: делаем вид, что всё прошло, ничего не отправляя
    if (f['website'].value) { done(''); return; }
    const v = FormGuard.check(guard, 'm1_booking', { minFillMs: 4000, cooldownMs: 60000, perHour: 3 });
    if (v && v.type === 'bot') { done(''); return; }
    if (v && v.type === 'fast') { show('err', 'Проверьте, пожалуйста, данные и нажмите «Отправить заявку» ещё раз.'); return; }
    if (v && v.type === 'retry') { show('err', 'Подождите ' + FormGuard.waitText(v.sec) + ' и попробуйте снова.'); return; }
    if (v && v.type === 'wait') {
      show('err', 'Заявка уже отправлена. Новую можно отправить через ' + FormGuard.waitText(v.sec) + ' Если срочно — позвоните: <a href="tel:+79032444222">+7 903 244-42-22</a>.');
      return;
    }

    const data = {
      form: 'Запись',
      name: FormGuard.clean(f['name'].value).slice(0, 60),
      phone: f['phone'].value.trim(),
      service: f['service'].value,
      date: f['date'].value,
      time: f['time'].value,
      car: FormGuard.clean(f['car'].value).slice(0, 60),
      comment: FormGuard.clean(f['comment'].value, true).slice(0, 500),
      consent: true,
      page: location.origin + location.pathname
    };

    // проверка данных
    if (!/^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё '’.-]{1,59}$/.test(data.name)) return bad(f['name'], 'Укажите имя буквами (минимум 2 буквы).');
    if (!/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(data.phone)) return bad(f['phone'], 'Введите номер телефона полностью.');
    if (!SERVICES.includes(data.service)) return bad(f['service'], 'Выберите услугу из списка.');
    if (!data.date || data.date < dateEl.min || data.date > dateEl.max) return bad(dateEl, 'Выберите дату в пределах ближайших 60 дней.');
    if (!HOURS.includes(data.time)) return bad(timeEl, 'Выберите время из списка.');
    if (data.date === iso(new Date()) && +data.time.slice(0, 2) <= new Date().getHours()) return bad(timeEl, 'Это время уже прошло — выберите другое.');
    if (FormGuard.hasLink(data.car)) return bad(f['car'], 'Пожалуйста, без ссылок.');
    if (FormGuard.hasLink(data.comment)) return bad(f['comment'], 'Пожалуйста, без ссылок в комментарии.');
    if (!f['consent'].checked) { show('err', 'Отметьте согласие на обработку персональных данных.'); f['consent'].focus(); return; }
    for (const k of ['name', 'car', 'comment']) {
      if (FormGuard.hasBadWords(data[k])) return bad(f[k], 'Пожалуйста, без нецензурных слов.');
    }

    if (!BOOKING_URL) {
      show('err', 'Форма пока не подключена к получению заявок. Позвоните нам: <a href="tel:+79032444222">+7 903 244-42-22</a>.');
      return;
    }

    sending = true; FormGuard.markTry(guard);
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Отправляем…';
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(BOOKING_URL, { method: 'POST', body: JSON.stringify(data), signal: ctrl.signal });
      clearTimeout(to);
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || 'server');
      FormGuard.record('m1_booking');
      done(data.phone);
    } catch (err) {
      show('err', 'Не получилось отправить заявку. Попробуйте ещё раз или позвоните нам: <a href="tel:+79032444222">+7 903 244-42-22</a>.');
    } finally {
      sending = false;
      btn.disabled = false; btn.textContent = label;
    }
  });
})();
