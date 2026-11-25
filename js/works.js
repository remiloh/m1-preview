/* Страница «Работы»: фильтр по услугам и листание фото в карточке */
(function () {
  // ---------- фильтр ----------
  var chips = document.querySelectorAll('.wk-chip');
  var cards = document.querySelectorAll('.wk-card');
  var cars = document.querySelectorAll('.wk-car');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
      cards.forEach(function (card) { card.hidden = !(f === 'all' || card.getAttribute('data-cat') === f); });
      cars.forEach(function (car) { car.hidden = !car.querySelector('.wk-card:not([hidden])'); });
    });
  });

  // ---------- галерея в карточке ----------
  document.querySelectorAll('.wk-media').forEach(function (media) {
    var track = media.querySelector('.wk-slides');
    var slides = track.children;
    var dots = media.querySelectorAll('.wk-dots span');
    var count = media.querySelector('.wk-count');
    if (slides.length < 2) return;
    function index() { return Math.round(track.scrollLeft / track.clientWidth); }
    function go(i) {
      i = (i + slides.length) % slides.length;
      track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
    }
    function mark() {
      var i = index();
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
      if (count) count.textContent = (i + 1) + ' / ' + slides.length;
    }
    var t;
    track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(mark, 60); }, { passive: true });
    media.querySelector('.wk-prev').addEventListener('click', function () { go(index() - 1); });
    media.querySelector('.wk-next').addEventListener('click', function () { go(index() + 1); });
  });
  // просмотр крупно (фото и видео) — общий для всего сайта, в js/common.js
})();
