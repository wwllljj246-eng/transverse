/* ============================================================
   设置 · 外观设置  #/settings/appearance
   浅色模式 / 深色模式 / 跟随系统
   切换后立即生效，全站所有页面统一响应（data-theme on <html>）
   ============================================================ */

import { settings, THEMES } from '../../data/settings.js';
import { icon } from '../../components/icons.js';
import { showToast } from '../../components/toast.js';
import { navBar, settingGroup } from '../../components/ui.js';
import { escapeHtml, bindBack } from '../../utils/dom.js';

export default function AppearancePage() {
  const page = document.createElement('div');
  page.className = 'page settings-page';

  page.innerHTML = `
    ${navBar('外观设置', '#/profile')}
    <div class="page-pad settings-body" id="appearance-body"></div>
  `;

  const body = page.querySelector('#appearance-body');

  function render() {
    const current = settings.theme;
    body.innerHTML = `
      ${settingGroup('主题模式', THEMES.map((t) => `
        <button class="option-row ${t.id === current ? 'is-active' : ''}" data-theme-id="${t.id}">
          <span class="option-ico">${icon(t.icon, 20)}</span>
          <span class="option-text">
            <span class="option-name">${escapeHtml(t.name)}</span>
            <span class="option-desc">${escapeHtml(t.desc)}</span>
          </span>
          <span class="option-check">${t.id === current ? icon('check', 15) : ''}</span>
        </button>`).join(''))}

      ${settingGroup('预览', `
        <div class="theme-preview">
          <div class="tp-card">
            <span class="tp-badge">${icon('sparkles', 13)} AI 表达</span>
            <p class="tp-text">听懂世界，自由表达</p>
            <p class="tp-sub">当前生效：${settings.resolvedTheme === 'dark' ? '深色' : '浅色'}</p>
          </div>
        </div>`)}

      <p class="group-hint">「跟随系统」会随手机深浅色设置自动切换，切换对全部页面生效</p>
    `;
  }

  body.addEventListener('click', (e) => {
    const row = e.target.closest('[data-theme-id]');
    if (!row) return;
    const id = row.dataset.themeId;
    if (id === settings.theme) return;
    settings.setTheme(id);
    render();
    showToast(`已切换为${THEMES.find((t) => t.id === id)?.name}`);
  });

  bindBack(page, '#/profile');
  render();
  return page;
}
