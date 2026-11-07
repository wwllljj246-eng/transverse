/* ============================================================
   实时 Tab  #/live
   实时语音能力的统一入口（此前是占位页）：
   ├─ 同声传译 / 实时转写 / 悬浮字幕
   └─ 最近转写记录，点击直达转写详情
   ============================================================ */

import { saves } from '../data/saves.js';
import { TRANSCRIPT_TYPES, categoryMeta } from '../data/type-meta.js';
import { icon } from '../components/icons.js';
import { pageHead, emptyState } from '../components/ui.js';
import { escapeHtml, formatTime } from '../utils/dom.js';

const ENTRIES = [
  { id: 'interpreter', icon: 'mic',      title: '同声传译', desc: '边说边译，双语文稿实时滚动' },
  { id: 'transcribe',  icon: 'fileText', title: '实时转写', desc: '语音实时转文字，自动生成 AI 总结' },
  { id: 'subtitle',    icon: 'subtitle', title: '悬浮字幕', desc: '屏幕悬浮双语字幕，跨 App 可看' },
];

export default function LivePage() {
  const page = document.createElement('div');
  page.className = 'page live-page';

  const recent = saves.list()
    .filter((r) => TRANSCRIPT_TYPES.includes(r.type))
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 3);

  page.innerHTML = `
    ${pageHead('实时', '实时语音翻译与转写')}

    <div class="live-entries page-pad">
      ${ENTRIES.map((e) => `
        <button class="live-entry" data-go="${e.id}">
          <span class="live-entry-ico">${icon(e.icon, 21)}</span>
          <span class="live-entry-text">
            <span class="live-entry-name">${escapeHtml(e.title)}</span>
            <span class="live-entry-desc">${escapeHtml(e.desc)}</span>
          </span>
          <span class="live-entry-arrow">${icon('chevronRight', 18)}</span>
        </button>`).join('')}
    </div>

    <div class="live-section-head">
      <h3 class="live-section-title">最近转写</h3>
      <button class="live-section-more" data-go="history">
        全部${icon('chevronRight', 14)}
      </button>
    </div>

    <div class="page-pad">
      ${recent.length ? `
        <div class="rec-list">
          ${recent.map((r) => {
            const meta = categoryMeta(r.payload?.category || 'meeting');
            return `
              <article class="rec-card rec-card-link" data-id="${r.id}">
                <div class="rec-top">
                  <span class="hist-badge hist-badge-transcribe">
                    ${icon(meta.icon, 14)} ${escapeHtml(r.title || meta.label)}
                  </span>
                  <span class="hist-time">${formatTime(r.ts)}</span>
                </div>
                <p class="rec-preview">${escapeHtml(r.payload?.summary || '点击查看完整转写与 AI 总结')}</p>
              </article>`;
          }).join('')}
        </div>`
        : emptyState({
            icon: 'mic',
            title: '还没有实时记录',
            sub: '使用同声传译或实时转写后，这里会显示最近的内容',
          })}
    </div>
  `;

  page.addEventListener('click', (e) => {
    const goBtn = e.target.closest('[data-go]');
    if (goBtn) {
      const id = goBtn.dataset.go;
      location.hash = id === 'history' ? '#/history' : `#/feature/${id}`;
      return;
    }
    const card = e.target.closest('.rec-card-link');
    if (card) location.hash = `#/transcript/${card.dataset.id}`;
  });

  return page;
}
