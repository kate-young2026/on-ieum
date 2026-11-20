// 온-이음 공통: 낮/밤 테마 기억, 방 레일 표시
(function () {
  var root = document.documentElement;
  try { var s = localStorage.getItem('onieum-theme'); if (s) root.dataset.theme = s; } catch (e) {}
  if (!root.dataset.theme) root.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-toggle]'); if (!b) return;
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('onieum-theme', root.dataset.theme); } catch (er) {}
  });
})();
