// M1 Detailing — страница «Отзывы»: форма «Оставить отзыв».
// Отзыв уходит в админку (через api/review.php) и появляется на сайте только после проверки.
// Здесь — первая проверка (мат, ссылки, боты); вторая, главная, — на сервере.
(function () {
  const form = document.getElementById('siteReviewForm');
  if (!form || typeof FormGuard === 'undefined') return;
  const SEND_URL = '/api/review.php';
  const status = form.querySelector('.lead-status');
  const btn = form.querySelector('.lead-submit');
  const guard = FormGuard.watch(form);
  let sending = false;

  const show = (type, html) => { status.className = 'lead-status ' + type; status.innerHTML = html; };
  const bad = (el, text) => {
    show('err', text);
    if (!el) return;
    el.classList.add('is-err');
    el.focus();
    el.addEventListener('input', () => el.classList.remove('is-err'), { once: true });
  };
  const done = () => {
    show('ok', 'Спасибо за отзыв! Он появится на сайте после проверки.');
    form.reset();
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending) return;
    const f = form.elements;
    if (f['website'].value) { done(); return; }          // ловушка для ботов

    const author = FormGuard.clean(f['author'].value).slice(0, 40);
    const service = FormGuard.clean(f['service'].value).slice(0, 60);
    const text = FormGuard.clean(f['text'].value, true).slice(0, 800);
    const starsEl = form.querySelector('input[name=stars]:checked');
    const stars = Math.max(1, Math.min(5, +(starsEl ? starsEl.value : 5) || 5));

    if (!/^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё '’.-]{1,39}$/.test(author)) return bad(f['author'], 'Укажите имя буквами (минимум 2 буквы).');
    if (text.replace(/\s/g, '').length < 10) return bad(f['text'], 'Напишите отзыв чуть подробнее — хотя бы пару предложений.');
    if ([author, service, text].some(FormGuard.hasLink)) return bad(f['text'], 'Пожалуйста, без ссылок.');
    for (const [k, v] of [['author', author], ['service', service], ['text', text]]) {
      if (v && FormGuard.hasBadWords(v)) return bad(f[k], 'Пожалуйста, без нецензурных слов.');
    }
    if (!f['consent'].checked) { show('err', 'Отметьте согласие на обработку персональных данных.'); f['consent'].focus(); return; }
    if (!f['publish'].checked) { show('err', 'Отметьте согласие на публикацию отзыва.'); f['publish'].focus(); return; }

    const v = FormGuard.check(guard, 'm1_site_review', { minFillMs: 5000, cooldownMs: 120000, perHour: 2 });
    if (v && v.type === 'bot') { done(); return; }
    if (v && v.type === 'fast') { show('err', 'Проверьте отзыв и нажмите «Отправить» ещё раз.'); return; }
    if (v && v.type === 'retry') { show('err', 'Подождите ' + FormGuard.waitText(v.sec) + ' и попробуйте снова.'); return; }
    if (v && v.type === 'wait') { show('err', 'Отзыв уже отправлен. Следующий можно оставить через ' + FormGuard.waitText(v.sec)); return; }

    sending = true; FormGuard.markTry(guard);
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Отправляем…';
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(SEND_URL, {
        method: 'POST', signal: ctrl.signal,
        body: JSON.stringify({ author, service, text, stars, consent: true, publish: true, page: location.origin + location.pathname })
      });
      clearTimeout(to);
      const out = await res.json();
      if (!out.ok) {
        if (out.error === 'words') return bad(f['text'], 'Пожалуйста, без нецензурных слов.');
        if (out.error === 'links') return bad(f['text'], 'Пожалуйста, без ссылок.');
        if (out.error === 'limit') return show('err', 'Отзыв уже отправлен. Попробуйте позже.');
        throw new Error(out.error || 'server');
      }
      FormGuard.record('m1_site_review');
      done();
    } catch (err) {
      show('err', 'Не получилось отправить отзыв. Попробуйте ещё раз чуть позже.');
    } finally {
      sending = false; btn.disabled = false; btn.textContent = label;
    }
  });
})();
