/* ============================================================
   设置 · 关于译境  #/settings/about
   App Version / Privacy Policy / Feedback（+ 检查更新）
   ============================================================ */

import { APP_INFO, PRIVACY_TEXT } from '../../data/app-info.js';
import { icon } from '../../components/icons.js';
import { showToast } from '../../components/toast.js';
import { navBar, settingGroup, settingRow } from '../../components/ui.js';
import { openSheet } from '../../components/sheet.js';
import { escapeHtml, bindBack } from '../../utils/dom.js';

export default function AboutPage() {
  const page = document.createElement('div');
  page.className = 'page settings-page';

  page.innerHTML = `
    ${navBar('关于译境', '#/profile')}

    <section class="about-hero">
      <div class="about-logo">${icon('translate', 30)}</div>
      <h2 class="about-name">${APP_INFO.name}<span> ${APP_INFO.nameEn}</span></h2>
      <p class="about-slogan">${escapeHtml(APP_INFO.slogan)}</p>
      <span class="about-version">v${APP_INFO.version} · Build ${APP_INFO.build}</span>
    </section>

    <div class="page-pad settings-body">
      ${settingGroup('应用信息', `
        ${settingRow({ id: 'version', icon: 'info', label: 'App Version', value: `v${APP_INFO.version}` })}
        ${settingRow({ id: 'check-update', icon: 'download', label: '检查更新', value: '已是最新', chevron: true })}
      `)}

      ${settingGroup('协议与反馈', `
        ${settingRow({ id: 'privacy', icon: 'shield', label: 'Privacy Policy', desc: '我们如何处理你的内容与数据', chevron: true })}
        ${settingRow({ id: 'feedback', icon: 'message', label: 'Feedback', desc: '遇到问题或有建议，告诉我们', chevron: true })}
      `)}

      <p class="footer-tip">© 2026 ${escapeHtml(APP_INFO.provider)}<br/>本应用为演示版本，翻译结果由 Mock 数据提供</p>
    </div>
  `;

  const body = page.querySelector('.settings-body');

  /* ---------- 隐私政策 ---------- */
  function openPrivacy() {
    openSheet({
      title: 'Privacy Policy',
      body: `
        <p class="sheet-meta">更新日期：${APP_INFO.privacyUpdated}</p>
        <div class="policy-text">
          ${PRIVACY_TEXT.split('\n').map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
        </div>`,
    });
  }

  /* ---------- 意见反馈 ---------- */
  function openFeedback() {
    const { body: sheetBody, close } = openSheet({
      title: 'Feedback',
      body: `
        <p class="sheet-meta">你的反馈会帮助我们改进译境</p>
        <textarea class="feedback-input" rows="5"
                  placeholder="说说遇到的问题，或希望增加的功能……"></textarea>
        <button class="feedback-submit" data-act="submit">提交反馈</button>`,
    });

    sheetBody.querySelector('[data-act="submit"]').addEventListener('click', () => {
      const ta = sheetBody.querySelector('.feedback-input');
      const text = (ta?.value || '').trim();
      if (!text) {
        showToast('请先写下你的反馈内容');
        return;
      }
      ta.value = '';
      close();
      showToast('感谢你的反馈，我们会认真查看');
    });
  }

  body.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'privacy') openPrivacy();
    else if (act === 'feedback') openFeedback();
    else if (act === 'check-update') showToast(`当前已是最新版本 v${APP_INFO.version}`);
    else if (act === 'version') showToast(`${APP_INFO.name} ${APP_INFO.nameEn} v${APP_INFO.version}`);
  });

  bindBack(page, '#/profile');
  return page;
}
