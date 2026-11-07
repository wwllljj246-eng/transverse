/* ============================================================
   通用占位页 — 「功能开发中」，带返回按钮
   ============================================================ */

import { icon } from '../components/icons.js';

/**
 * @param {{title: string, icon?: string, sub?: string}} opts
 */
export function createPlaceholderPage({ title, icon: iconName = 'sparkles', sub }) {
  const page = document.createElement('div');
  page.className = 'page';
  page.innerHTML = `
    <div class="nav-bar">
      <button class="nav-back" aria-label="返回">${icon('chevronLeft', 20)}</button>
      <span class="nav-title">${title}</span>
      <span class="nav-spacer"></span>
    </div>
    <div class="placeholder-body">
      <div class="placeholder-icon">${icon(iconName, 36)}</div>
      <h2 class="placeholder-title">功能开发中</h2>
      <p class="placeholder-sub">${sub || '该功能将在后续版本上线，敬请期待'}</p>
    </div>
  `;

  // 返回：优先回到上一页；无历史（直达/刷新）则回首页
  page.querySelector('.nav-back').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#/';
  });

  return page;
}
