/* ============================================================
   轻量 Toast 提示 — 全局单例，自动消失
   ============================================================ */

let timer = null;

export function showToast(message, duration = 1800) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.getElementById('app').appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');

  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('show'), duration);
}
