/* ============================================================
   底部导航栏组件 — 5 个 Tab，跟随路由高亮
   ============================================================ */

import { TABS } from '../data/mock.js';
import { icon } from './icons.js';

export function TabBar(activeTab) {
  const nav = document.createElement('nav');
  nav.className = 'tab-bar';
  nav.setAttribute('aria-label', '底部导航');

  nav.innerHTML = TABS.map(
    (t) => `
    <button class="tab-item ${t.id === activeTab ? 'is-active' : ''}"
            data-tab="${t.id}" data-path="${t.path}"
            aria-label="${t.label}" ${t.id === activeTab ? 'aria-current="page"' : ''}>
      <span class="tab-icon">${icon(t.icon, 22)}</span>
      <span class="tab-label">${t.label}</span>
    </button>`
  ).join('');

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-item');
    if (btn) location.hash = btn.dataset.path;
  });

  return nav;
}
