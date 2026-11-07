/* ============================================================
   设置 · 字体大小  #/settings/font
   小 / 标准 / 大 —— 通过 --fs-scale 驱动设计系统全部字号变量
   ============================================================ */

import { settings, FONT_SIZES } from '../../data/settings.js';
import { icon } from '../../components/icons.js';
import { showToast } from '../../components/toast.js';
import { navBar, settingGroup } from '../../components/ui.js';
import { escapeHtml, bindBack } from '../../utils/dom.js';

export default function FontSizePage() {
  const page = document.createElement('div');
  page.className = 'page settings-page';

  page.innerHTML = `
    ${navBar('字体大小', '#/profile')}
    <div class="page-pad settings-body" id="font-body"></div>
  `;

  const body = page.querySelector('#font-body');

  function render() {
    const current = settings.fontSize;
    body.innerHTML = `
      ${settingGroup('字号', FONT_SIZES.map((f) => `
        <button class="option-row ${f.id === current ? 'is-active' : ''}" data-font-id="${f.id}">
          <span class="option-ico">${icon('typeAa', 20)}</span>
          <span class="option-text">
            <span class="option-name">${escapeHtml(f.name)}</span>
            <span class="option-desc">${escapeHtml(f.desc)}</span>
          </span>
          <span class="option-check">${f.id === current ? icon('check', 15) : ''}</span>
        </button>`).join(''))}

      ${settingGroup('预览', `
        <div class="font-preview">
          <p class="fp-title">听懂世界，自由表达</p>
          <p class="fp-body">译文正文会随所选字号同步变化，正文、标题、注释整体缩放，不用逐页调整。</p>
          <p class="fp-caption">注释文字 · 当前字号 ${FONT_SIZES.find((x) => x.id === current)?.name}</p>
        </div>`)}
    `;
  }

  body.addEventListener('click', (e) => {
    const row = e.target.closest('[data-font-id]');
    if (!row) return;
    const id = row.dataset.fontId;
    if (id === settings.fontSize) return;
    settings.setFontSize(id);
    render();
    showToast(`字体大小已设为「${FONT_SIZES.find((f) => f.id === id)?.name}」`);
  });

  bindBack(page, '#/profile');
  render();
  return page;
}
