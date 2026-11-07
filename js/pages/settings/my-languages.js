/* ============================================================
   设置 · 我的语言  #/settings/languages
   管理常用语言：最近使用（可移除）+ 全部语言（点击加入我的语言）
   ============================================================ */

import { settings } from '../../data/settings.js';
import { LANGUAGES, LANGUAGE_GROUPS } from '../../data/languages.js';
import { icon } from '../../components/icons.js';
import { flagSvg } from '../../components/flags.js';
import { showToast } from '../../components/toast.js';
import { navBar, settingGroup } from '../../components/ui.js';
import { escapeHtml, bindBack } from '../../utils/dom.js';

export default function MyLanguagesPage() {
  const page = document.createElement('div');
  page.className = 'page settings-page';

  page.innerHTML = `
    ${navBar('我的语言', '#/profile')}
    <div class="page-pad settings-body" id="my-lang-body"></div>
  `;

  const body = page.querySelector('#my-lang-body');

  function langRow(code, { removable = false } = {}) {
    const l = LANGUAGES[code];
    if (!l) return '';
    return `
      <div class="lang-row" data-code="${code}">
        ${flagSvg(l.flag)}
        <span class="lang-row-text">
          <span class="lang-row-name">${escapeHtml(l.native)}</span>
          <span class="lang-row-sub">${escapeHtml(l.name)}</span>
        </span>
        ${removable
          ? `<button class="star-btn" data-remove="${code}" aria-label="从我的语言中移除">${icon('trash', 17)}</button>`
          : (() => {
            const on = settings.recentLangs.includes(code);
            return `<button class="check-badge ${on ? '' : 'is-off'}" data-add="${code}"
                            aria-label="${on ? '从我的语言中移除' : '加入我的语言'}">
                      ${icon(on ? 'check' : 'plus', 14)}
                    </button>`;
          })()}
      </div>`;
  }

  function render() {
    const recent = settings.recentLangs;
    const defaultCode = settings.defaultLang;

    body.innerHTML = `
      ${settingGroup('最近使用', `
        <div class="lang-group-body">
          ${recent.length
            ? recent.map((c) => langRow(c, { removable: true })).join('')
            : '<p class="row-empty">还没有常用语言，从下方列表点击添加</p>'}
        </div>`)}

      ${settingGroup('默认翻译语言', `
        <div class="lang-group-body">
          ${langRow(defaultCode)}
        </div>
        <p class="group-hint">默认翻译语言可在「翻译设置」中修改</p>`)}

      ${LANGUAGE_GROUPS.map((g) => settingGroup(g.title, `
        <div class="lang-group-body">
          ${g.codes.map((c) => langRow(c)).join('')}
        </div>`)).join('')}
    `;
  }

  body.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      const code = addBtn.dataset.add;
      if (settings.recentLangs.includes(code)) {
        settings.removeRecentLang(code);
        showToast('已从我的语言移除');
      } else {
        settings.addRecentLang(code);
        showToast('已加入我的语言');
      }
      render();
      return;
    }

    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
      settings.removeRecentLang(removeBtn.dataset.remove);
      showToast('已从我的语言移除');
      render();
      return;
    }

    const row = e.target.closest('.lang-row');
    if (row && !e.target.closest('button')) {
      const code = row.dataset.code;
      settings.addRecentLang(code);
      showToast(`已使用 ${LANGUAGES[code]?.native || code}`);
      render();
    }
  });

  bindBack(page, '#/profile');
  render();
  return page;
}
