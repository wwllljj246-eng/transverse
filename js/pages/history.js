/* ============================================================
   记录页 — 三个 Tab
   ├─ 历史：文本翻译 / 拍照翻译 / 同声传译（原语言·翻译语言·内容·时间）
   │        支持 查看详情 / 收藏 / 删除
   ├─ 收藏：单词 / 句子（搜索 · 详情 · 删除）
   └─ 转写：会议记录 / 课程记录 / 演讲记录 → 点击进入转写详情页
   数据源：saves（统一记录库）+ favorites（翻译收藏）
   ============================================================ */

import { saves } from '../data/saves.js';
import { favorites } from '../data/favorites.js';
import { LANGUAGES } from '../data/languages.js';
import { TONES } from '../data/translation-mock.js';
import { HISTORY_TYPES, TRANSCRIPT_TYPES, categoryMeta, typeMeta } from '../data/type-meta.js';
import { icon } from '../components/icons.js';
import { flagSvg } from '../components/flags.js';
import { showToast } from '../components/toast.js';
import { pageHead, segTabs, emptyState } from '../components/ui.js';
import { escapeHtml, formatTime, charCount, copyText, bindBack } from '../utils/dom.js';

const TABS = [
  { id: 'history',    label: '历史', icon: 'history' },
  { id: 'favorites',  label: '收藏', icon: 'star' },
  { id: 'transcript', label: '转写', icon: 'fileText' },
];

const CATEGORY_ORDER = ['meeting', 'class', 'speech'];

export default function HistoryPage() {
  let activeTab = 'history';
  let keyword = '';
  let detailKey = null;   // 记录 id / 收藏 id

  const page = document.createElement('div');
  page.className = 'page history-page';

  page.innerHTML = `
    ${pageHead('记录', '所有翻译、拍照、同传与转写记录')}
    <div class="page-pad">${segTabs(TABS, activeTab)}</div>
    <div class="rec-panel page-pad"></div>

    <div class="detail-mask" aria-hidden="true"></div>
    <div class="detail-sheet" role="dialog" aria-modal="true" aria-label="记录详情"></div>
  `;

  const tabsEl = page.querySelector('.seg-tabs');
  const panelEl = page.querySelector('.rec-panel');
  const maskEl = page.querySelector('.detail-mask');
  const sheetEl = page.querySelector('.detail-sheet');

  bindBack(page, '#/');

  /* ---------- Tab 切换 ---------- */
  tabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('.seg-tab');
    if (!tab) return;
    const next = tab.dataset.tab;
    if (next === activeTab) return;
    activeTab = next;
    keyword = '';
    closeDetail();
    tabsEl.querySelectorAll('.seg-tab').forEach((el) => {
      const active = el.dataset.tab === next;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-selected', String(active));
    });
    renderPanel();
  });

  /* ---------- 数据聚合 ---------- */

  /** 历史 Tab：文本 / 拍照 / 同传，时间倒序 */
  function historyRecords() {
    return saves.list()
      .filter((r) => HISTORY_TYPES.includes(r.type))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  /** 转写 Tab：转写 / AI 整理，时间倒序 */
  function transcriptRecords() {
    return saves.list()
      .filter((r) => TRANSCRIPT_TYPES.includes(r.type))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  /** 收藏 Tab：关键词过滤 */
  function favoriteRecords() {
    const kw = keyword.trim().toLowerCase();
    const list = favorites.list().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    if (!kw) return list;
    return list.filter((f) =>
      (f.sourceText || '').toLowerCase().includes(kw)
      || (f.text || '').toLowerCase().includes(kw));
  }

  /* ---------- 渲染 ---------- */
  function renderPanel() {
    if (activeTab === 'history') renderHistory();
    else if (activeTab === 'favorites') renderFavorites();
    else renderTranscript();
  }

  /* ---- 历史 ---- */
  function renderHistory() {
    const list = historyRecords();
    if (!list.length) {
      panelEl.innerHTML = emptyState({
        icon: 'history',
        title: '暂无历史记录',
        sub: '使用文本翻译、拍照翻译或同声传译后，记录会出现在这里',
      });
      return;
    }
    panelEl.innerHTML = `
      <div class="rec-list">
        ${list.map((r) => historyCardHTML(r)).join('')}
      </div>`;
    bindCardEvents(panelEl, list.map((r) => r.id), 'save');
  }

  function historyCardHTML(r) {
    const meta = typeMeta(r.type);
    const p = r.payload || {};
    const isFav = favorites.has(recordToFavorite(r));
    return `
      <article class="rec-card" data-id="${r.id}">
        <div class="rec-top">
          <span class="hist-badge hist-badge-${meta.badge}">${icon(meta.icon, 14)} ${meta.label}</span>
          <span class="hist-time">${formatTime(r.ts)}</span>
        </div>
        ${langLineHTML(recordLang(r))}
        <p class="rec-preview">${escapeHtml(previewText(r))}</p>
        <div class="rec-actions">
          <button class="rec-act ${isFav ? 'is-faved' : ''}" data-act="fav" aria-label="收藏">
            ${icon(isFav ? 'starFill' : 'star', 16)}<span>${isFav ? '已收藏' : '收藏'}</span>
          </button>
          <button class="rec-act is-danger" data-act="delete" aria-label="删除">
            ${icon('trash', 16)}<span>删除</span>
          </button>
        </div>
      </article>`;
  }

  /* ---- 收藏 ---- */
  function renderFavorites() {
    const list = favoriteRecords();
    const total = favorites.list().length;
    const searchHTML = `
      <div class="search-bar">
        <span class="search-ico">${icon('search', 17)}</span>
        <input class="search-input" type="search" placeholder="搜索单词或句子"
               value="${escapeHtml(keyword)}" aria-label="搜索收藏" />
        <button class="search-clear ${keyword ? 'is-show' : ''}" aria-label="清空搜索">
          ${icon('close', 14)}
        </button>
      </div>`;

    // 列表容器常驻，避免搜索重绘时把搜索框一起冲掉
    panelEl.innerHTML = searchHTML
      + `<p class="rec-count">${list.length ? `共 ${list.length} 条收藏` : ''}</p>`
      + `<div class="rec-list"></div>`;

    paintFavorites(list, total);
    bindSearch();
  }

  /** 只重绘收藏列表本体 */
  function paintFavorites(list, total) {
    const host = panelEl.querySelector('.rec-list');
    if (!host) return;
    if (!list.length) {
      host.innerHTML = emptyState({
        icon: total ? 'search' : 'star',
        title: total ? '没有匹配的收藏' : '还没有收藏',
        sub: total ? '换个关键词试试' : '在翻译结果或记录中点☆即可收藏',
      });
      return;
    }
    host.innerHTML = list.map((f) => favoriteCardHTML(f)).join('');
    bindCardEvents(host, list.map((f) => f.id), 'fav');
  }

  function favoriteCardHTML(f) {
    const kind = favKind(f);
    return `
      <article class="rec-card" data-id="${f.id}">
        <div class="rec-top">
          <span class="hist-badge hist-badge-favorites">${icon(kind === 'word' ? 'zap' : 'chat', 14)} ${kind === 'word' ? '单词' : '句子'}</span>
          <span class="hist-time">${formatTime(f.ts)}</span>
        </div>
        ${langLineHTML({ from: f.from, to: f.to })}
        <p class="rec-preview">
          <span class="rec-src">${escapeHtml(f.sourceText || '')}</span>
          <span class="rec-dst">${escapeHtml(f.text || '')}</span>
        </p>
        <div class="rec-actions">
          <button class="rec-act is-danger" data-act="delete" aria-label="删除收藏">
            ${icon('trash', 16)}<span>删除收藏</span>
          </button>
        </div>
      </article>`;
  }

  /* ---- 转写 ---- */
  function renderTranscript() {
    const list = transcriptRecords();
    if (!list.length) {
      panelEl.innerHTML = emptyState({
        icon: 'fileText',
        title: '暂无转写记录',
        sub: '使用实时转写并保存后，会议 / 课程 / 演讲记录会出现在这里',
      });
      return;
    }

    const groups = CATEGORY_ORDER.map((id) => ({
      id,
      meta: categoryMeta(id),
      items: list.filter((r) => (r.payload?.category || 'meeting') === id),
    })).filter((g) => g.items.length);

    panelEl.innerHTML = groups.map((g) => `
      <section class="rec-group">
        <h3 class="rec-group-title">${g.meta.emoji} ${g.meta.label} · ${g.items.length}</h3>
        <div class="rec-list">
          ${g.items.map((r) => transcriptCardHTML(r)).join('')}
        </div>
      </section>`).join('');

    panelEl.querySelectorAll('.rec-card').forEach((card) => {
      card.addEventListener('click', () => {
        location.hash = `#/transcript/${card.dataset.id}`;
      });
    });
  }

  function transcriptCardHTML(r) {
    const p = r.payload || {};
    const meta = categoryMeta(p.category || 'meeting');
    const summary = p.summary || (p.highlights?.length
      ? `重点 ${p.highlights.length} 条 · 待办 ${(p.todos || []).length} 项`
      : '暂无摘要');
    return `
      <article class="rec-card rec-card-link" data-id="${r.id}">
        <div class="rec-top">
          <span class="hist-badge hist-badge-transcribe">${icon(meta.icon, 14)} ${escapeHtml(r.title || meta.label)}</span>
          <span class="hist-time">${formatTime(r.ts)}</span>
        </div>
        <p class="rec-preview">${escapeHtml(summary)}</p>
        <div class="rec-meta">
          <span>${escapeHtml(LANGUAGES[p.source]?.native || p.source || '中文普通话')}</span>
          ${p.text ? `<span>${charCount(p.text)} 字</span>` : ''}
          <span class="rec-more">查看详情 ${icon('chevronRight', 14)}</span>
        </div>
      </article>`;
  }

  /* ---------- 通用卡片事件 ---------- */
  function bindCardEvents(root, ids, kind) {
    root.querySelectorAll('.rec-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        const actBtn = e.target.closest('[data-act]');
        const id = card.dataset.id;
        if (actBtn) {
          e.stopPropagation();
          if (actBtn.dataset.act === 'delete') deleteRecord(id, kind);
          else if (actBtn.dataset.act === 'fav') toggleFavorite(id);
          return;
        }
        detailKey = id;
        openDetail();
      });
    });
  }

  function bindSearch() {
    const input = panelEl.querySelector('.search-input');
    const clear = panelEl.querySelector('.search-clear');
    if (!input) return;

    input.addEventListener('input', () => {
      keyword = input.value;
      // 仅重绘列表本体，保持输入焦点，避免每输入一个字就失焦
      const pos = input.selectionStart;
      const list = favoriteRecords();
      const countEl = panelEl.querySelector('.rec-count');
      if (countEl) countEl.textContent = list.length ? `共 ${list.length} 条收藏` : '';
      paintFavorites(list, favorites.list().length);
      clear.classList.toggle('is-show', !!keyword);
      input.focus();
      input.setSelectionRange(pos, pos);
    });

    clear.addEventListener('click', () => {
      keyword = '';
      renderFavorites();
    });
  }

  /* ---------- 详情 ---------- */
  function openDetail() {
    const found = findDetail(detailKey);
    if (!found) return;
    sheetEl.innerHTML = detailHTML(found);
    sheetEl.classList.add('is-open');
    maskEl.classList.add('is-show');

    sheetEl.querySelector('.detail-close')?.addEventListener('click', closeDetail);
    maskEl.addEventListener('click', closeDetail);

    sheetEl.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const act = btn.dataset.act;
        if (act === 'delete') {
          deleteRecord(detailKey, found.kind);
          closeDetail();
        } else if (act === 'fav') {
          toggleFavorite(detailKey);
          closeDetail();
        } else if (act === 'copy') {
          const ok = await copyText(found.copyText);
          showToast(ok ? '已复制到剪贴板' : '复制失败，请长按手动选择');
        }
      });
    });
  }

  function closeDetail() {
    sheetEl.classList.remove('is-open');
    maskEl.classList.remove('is-show');
    detailKey = null;
  }

  function findDetail(id) {
    const save = saves.get(id);
    if (save) return { kind: 'save', record: save, type: save.type, payload: save.payload || {}, ts: save.ts, title: save.title };

    const fav = favorites.get(id);
    if (fav) {
      return {
        kind: 'fav',
        record: fav,
        type: 'favorites',
        payload: fav,
        ts: fav.ts,
        title: '翻译收藏',
        copyText: `${fav.sourceText}\n${fav.text}`,
      };
    }
    return null;
  }

  function detailHTML(d) {
    const p = d.payload;
    const meta = d.type === 'favorites'
      ? { label: '翻译收藏', icon: 'star', badge: 'favorites' }
      : typeMeta(d.type);

    let body = '';
    let copyValue = d.copyText || '';

    switch (d.type) {
      case 'text':
      case 'favorites': {
        const from = d.type === 'favorites' ? p.from : p.from;
        const to = d.type === 'favorites' ? p.to : p.to;
        copyValue = `${p.sourceText}\n${p.text}`;
        body = `
          ${langLineHTML({ from, to })}
          ${p.tone ? `<div class="detail-tone">${toneLabel(p.tone)}</div>` : ''}
          <div class="detail-block">
            <div class="detail-block-label">原文</div>
            <p class="detail-block-text">${escapeHtml(p.sourceText || '')}</p>
          </div>
          <div class="detail-block">
            <div class="detail-block-label">译文</div>
            <p class="detail-block-text">${escapeHtml(p.text || '')}</p>
          </div>`;
        break;
      }
      case 'photo':
        copyValue = (p.items || []).map((i) => `${i.src} → ${i.dst}`).join('\n');
        body = `
          ${langLineHTML({ from: p.source, to: p.target })}
          <div class="detail-block">
            <div class="detail-block-label">识别结果（${(p.items || []).length} 条）</div>
            <ul class="detail-photo-list">
              ${(p.items || []).map((i) => `
                <li>
                  <span class="dp-src">${escapeHtml(i.src)}</span>
                  <span class="dp-arrow">→</span>
                  <span class="dp-dst">${escapeHtml(i.dst)}</span>
                </li>`).join('')}
            </ul>
          </div>`;
        break;
      case 'interpreter':
        copyValue = `${p.sourceText}\n${p.targetText}`;
        body = `
          ${langLineHTML({ from: p.source, to: p.target })}
          <div class="detail-block">
            <div class="detail-block-label">原文</div>
            <p class="detail-block-text">${escapeHtml(p.sourceText || '')}</p>
          </div>
          <div class="detail-block">
            <div class="detail-block-label">译文</div>
            <p class="detail-block-text">${escapeHtml(p.targetText || '')}</p>
          </div>`;
        break;
      case 'transcribe':
      case 'summary':
        copyValue = p.text || (p.highlights || []).map((h) => `${h.no}. ${h.text}`).join('\n');
        body = `
          ${p.text ? `
            <div class="detail-block">
              <div class="detail-block-label">转写内容</div>
              <p class="detail-block-text">${escapeHtml(p.text)}</p>
            </div>` : ''}
          ${p.highlights?.length ? `
            <h4 class="detail-sub">会议重点</h4>
            <ol class="detail-highlights">
              ${p.highlights.map((h) => `<li>${h.no}. ${escapeHtml(h.text)}</li>`).join('')}
            </ol>` : ''}
          ${p.todos?.length ? `
            <h4 class="detail-sub">待办事项</h4>
            <ul class="detail-todos">
              ${p.todos.map((t) => `
                <li class="${t.done ? 'is-done' : ''}">
                  <span class="todo-mark">${t.done ? '✓' : '○'}</span>${escapeHtml(t.text)}
                </li>`).join('')}
            </ul>` : ''}
          ${saves.get(d.record.id) ? `
            <button class="detail-goto" data-act="goto">${icon('fileText', 16)} 打开完整转写详情</button>` : ''}`;
        break;
      default:
        body = `<div class="detail-block">
            <div class="detail-block-label">内容</div>
            <p class="detail-block-text">${escapeHtml(d.title || '')}</p>
          </div>`;
    }

    const canFav = ['text', 'photo', 'interpreter'].includes(d.type);

    return `
      <div class="detail-sheet-inner">
        <div class="detail-grip"></div>
        <div class="detail-header">
          <span class="hist-badge hist-badge-${meta.badge}">${icon(meta.icon, 14)} ${meta.label}</span>
          <button class="detail-close" aria-label="关闭">${icon('close', 18)}</button>
        </div>
        <div class="detail-time">${formatTime(d.ts)}</div>
        <div class="detail-body">${body}</div>
        <div class="detail-actions">
          ${copyValue ? `<button class="detail-act" data-act="copy">${icon('copy', 16)} 复制</button>` : ''}
          ${canFav ? `<button class="detail-act" data-act="fav">${icon('star', 16)} ${favLabel(d)}</button>` : ''}
          <button class="detail-act is-danger" data-act="delete">${icon('trash', 16)} 删除</button>
        </div>
      </div>`;
  }

  /** 详情里「打开完整转写详情」跳转 */
  sheetEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="goto"]')) {
      const id = detailKey;
      closeDetail();
      location.hash = `#/transcript/${id}`;
    }
  });

  function favLabel(d) {
    if (d.kind === 'fav') return '取消收藏';
    return favorites.has(recordToFavorite(d.record)) ? '取消收藏' : '收藏';
  }

  /* ---------- 收藏 / 删除 ---------- */
  function toggleFavorite(id) {
    const r = saves.get(id);
    if (!r) return;
    const added = favorites.toggle(recordToFavorite(r));
    showToast(added ? '已加入收藏' : '已取消收藏');
    renderPanel();
  }

  function deleteRecord(id, kind) {
    if (kind === 'fav') favorites.remove(id);
    else saves.remove(id);
    showToast(kind === 'fav' ? '已删除收藏' : '已删除记录');
    renderPanel();
  }

  /* ---------- 记录 → 收藏 结构归一化 ---------- */
  function recordToFavorite(r) {
    const p = r.payload || {};
    if (r.type === 'text') {
      return { from: p.from, to: p.to, tone: p.tone || 'natural', sourceText: p.sourceText, text: p.text };
    }
    if (r.type === 'interpreter') {
      return { from: p.source, to: p.target, tone: 'natural', sourceText: p.sourceText, text: p.targetText };
    }
    // photo
    return {
      from: p.source,
      to: p.target,
      tone: 'natural',
      sourceText: (p.items || []).map((i) => i.src).join(' / '),
      text: (p.items || []).map((i) => i.dst).join(' / '),
    };
  }

  /* ---------- 展示辅助 ---------- */
  function recordLang(r) {
    const p = r.payload || {};
    return { from: p.from || p.source, to: p.to || p.target };
  }

  function previewText(r) {
    const p = r.payload || {};
    switch (r.type) {
      case 'text':        return p.sourceText || '';
      case 'photo':       return (p.items || []).map((i) => `${i.src} → ${i.dst}`).join('，');
      case 'interpreter': return p.targetText || p.sourceText || '';
      case 'transcribe':  return (p.text || '').slice(0, 70);
      case 'summary':     return `重点 ${(p.highlights || []).length} 条 · 待办 ${(p.todos || []).length} 项`;
      default:            return r.title || '';
    }
  }

  function langLineHTML({ from, to }) {
    return `
      <div class="rec-lang">
        ${langTag(from)}
        <span class="rec-arrow">${icon('chevronRight', 14)}</span>
        ${langTag(to)}
      </div>`;
  }

  function langTag(code) {
    const l = LANGUAGES[code];
    if (!l) return `<span class="rec-lang-name">${escapeHtml(code || '未知')}</span>`;
    return `<span class="rec-lang-name">${flagSvg(l.flag)} ${escapeHtml(l.native)}</span>`;
  }

  function toneLabel(tone) {
    const t = TONES.find((x) => x.id === tone);
    return t ? `AI 表达：${t.emoji} ${t.name}` : '';
  }

  /** 单词 / 句子判定：无空格且不含中文标点的短词视为单词 */
  function favKind(f) {
    const s = (f.sourceText || '').trim();
    return /^[\x20-\x7E]+$/.test(s) && !/\s/.test(s) ? 'word' : 'sentence';
  }

  /* ---------- 初始化 ---------- */
  renderPanel();

  return page;
}
