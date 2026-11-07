/* ============================================================
   设置 · 翻译设置  #/settings/translate
   ├─ 默认语言（底部弹层选择，全站语言数据统一来自 languages.js）
   ├─ 自动检测语言（开关）
   └─ 自动播放（开关，朗读译文）
   ============================================================ */

import { settings } from '../../data/settings.js';
import { LANGUAGES, LANGUAGE_GROUPS } from '../../data/languages.js';
import { TONES } from '../../data/translation-mock.js';
import { icon } from '../../components/icons.js';
import { flagSvg } from '../../components/flags.js';
import { showToast } from '../../components/toast.js';
import { navBar, settingGroup, settingRow, switchEl } from '../../components/ui.js';
import { openSheet } from '../../components/sheet.js';
import { escapeHtml, bindBack, setActiveBy } from '../../utils/dom.js';

export default function TranslateSettingsPage() {
  const page = document.createElement('div');
  page.className = 'page settings-page';

  page.innerHTML = `
    ${navBar('翻译设置', '#/profile')}
    <div class="page-pad settings-body" id="ts-body"></div>
  `;

  const body = page.querySelector('#ts-body');

  function render() {
    const code = settings.defaultLang;
    const lang = LANGUAGES[code];
    body.innerHTML = `
      ${settingGroup('语言', `
        ${settingRow({
          id: 'pick-lang',
          icon: 'globe',
          label: '默认语言',
          desc: '打开翻译页时默认翻译成的目标语言',
          value: lang ? `${lang.name}` : code,
          chevron: true,
        })}
        ${settingRow({
          icon: 'sparkles',
          label: '自动检测语言',
          desc: '根据输入内容自动判断原文语言',
          control: switchEl({ id: 'autoDetect', checked: settings.autoDetect, label: '自动检测语言' }),
        })}
      `)}

      ${settingGroup('朗读', `
        ${settingRow({
          icon: 'volume',
          label: '自动播放',
          desc: '翻译完成后自动朗读译文',
          control: switchEl({ id: 'autoPlay', checked: settings.autoPlay, label: '自动播放' }),
        })}
      `)}

      ${settingGroup('默认 AI 语气', `
        <div class="tone-row">
          ${TONES.map((t) => `
            <button class="tone-chip ${t.id === settings.defaultTone ? 'is-active' : ''}"
                    data-tone="${t.id}">${t.emoji} ${escapeHtml(t.name)}</button>`).join('')}
        </div>
        <p class="group-hint">文本翻译页打开时默认选中的表达风格</p>
      `)}
    `;
  }

  /* ---------- 默认语言选择弹层 ---------- */
  function openLangPicker() {
    const bg = LANGUAGE_GROUPS.map((g) => `
      <h4 class="sheet-group-title">${escapeHtml(g.title)}</h4>
      <div class="lang-group-body">
        ${g.codes.map((c) => {
          const l = LANGUAGES[c];
          if (!l) return '';
          const active = c === settings.defaultLang;
          return `
            <div class="lang-row ${active ? 'is-active' : ''}" data-pick="${c}">
              ${flagSvg(l.flag)}
              <span class="lang-row-text">
                <span class="lang-row-name">${escapeHtml(l.native)}</span>
                <span class="lang-row-sub">${escapeHtml(l.name)}</span>
              </span>
              ${active ? `<span class="check-badge">${icon('check', 14)}</span>` : ''}
            </div>`;
        }).join('')}
      </div>`).join('');

    const { body: sheetBody, close } = openSheet({ title: '选择默认语言', body: bg });

    sheetBody.addEventListener('click', (e) => {
      const row = e.target.closest('[data-pick]');
      if (!row) return;
      const code = row.dataset.pick;
      settings.setDefaultLang(code);
      settings.addRecentLang(code);
      close();
      render();
      showToast(`默认语言已设为 ${LANGUAGES[code]?.native || code}`);
    });
  }

  body.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="pick-lang"]')) {
      openLangPicker();
      return;
    }

    const tone = e.target.closest('[data-tone]');
    if (tone) {
      settings.setDefaultTone(tone.dataset.tone);
      setActiveBy(body, '[data-tone]', 'tone', tone.dataset.tone);
      showToast(`默认语气已设为「${TONES.find((t) => t.id === tone.dataset.tone)?.name}」`);
      return;
    }

    const sw = e.target.closest('[data-switch]');
    if (!sw) return;
    const id = sw.dataset.switch;
    const next = !sw.classList.contains('is-on');
    sw.classList.toggle('is-on', next);
    sw.setAttribute('aria-checked', String(next));

    if (id === 'autoDetect') {
      settings.setAutoDetect(next);
      showToast(next ? '已开启自动检测语言' : '已关闭自动检测语言');
    } else if (id === 'autoPlay') {
      settings.setAutoPlay(next);
      showToast(next ? '已开启自动播放译文' : '已关闭自动播放');
    }
  });

  bindBack(page, '#/profile');
  render();
  return page;
}
