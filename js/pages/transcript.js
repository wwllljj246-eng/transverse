/* ============================================================
   转写详情页  #/transcript/:id
   ├─ 顶部：分类徽标 + 标题 + 源语言 / 字数 / 时间
   ├─ AI 总结
   ├─ 会议重点（编号列表）
   ├─ 完整转写内容（按段落渲染）
   └─ 待办事项（可勾选，状态回写 saves）
   数据源：saves（type: transcribe / summary）
   ============================================================ */

import { saves } from '../data/saves.js';
import { LANGUAGES } from '../data/languages.js';
import { categoryMeta } from '../data/type-meta.js';
import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { navBar, emptyState } from '../components/ui.js';
import { showConfirm } from '../components/confirm.js';
import { escapeHtml, formatFullTime, charCount, copyText, bindBack } from '../utils/dom.js';

export default function TranscriptPage(id) {
  const record = saves.get(id);
  const page = document.createElement('div');
  page.className = 'page transcript-detail-page';

  /* ---------- 记录不存在 ---------- */
  if (!record) {
    page.innerHTML = `
      ${navBar('转写详情', '#/history')}
      <div class="page-pad">
        ${emptyState({
          icon: 'fileText',
          title: '记录不存在',
          sub: '该转写记录可能已被删除，返回记录页看看其他内容',
        })}
      </div>`;
    bindBack(page, '#/history');
    return page;
  }

  const p = record.payload || {};
  const meta = categoryMeta(p.category || 'meeting');
  const langName = LANGUAGES[p.source]?.native || p.source || '中文普通话';
  // 待办状态单独持有，勾选后写库
  let todos = (p.todos || []).map((t) => ({ ...t }));

  const paragraphs = String(p.text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  page.innerHTML = `
    ${navBar('转写详情', '#/history')}

    <section class="td-hero page-pad">
      <div class="td-hero-card">
        <span class="td-hero-emoji">${meta.emoji}</span>
        <h2 class="td-hero-title">${escapeHtml(record.title || meta.label)}</h2>
        <div class="td-hero-meta">
          <span class="td-chip">${icon(meta.icon, 13)} ${meta.label}</span>
          <span class="td-chip">${escapeHtml(langName)}</span>
          ${p.text ? `<span class="td-chip">${charCount(p.text)} 字</span>` : ''}
        </div>
        <p class="td-hero-time">${formatFullTime(record.ts)}</p>
      </div>
    </section>

    <div class="page-pad td-body">
      ${p.summary ? `
        <section class="td-section">
          <h3 class="td-section-title">${icon('sparkles', 17)} AI 总结</h3>
          <p class="td-summary">${escapeHtml(p.summary)}</p>
        </section>` : ''}

      ${p.highlights?.length ? `
        <section class="td-section">
          <h3 class="td-section-title">${icon('list', 17)} 会议重点</h3>
          <ol class="td-highlights">
            ${p.highlights.map((h) => `
              <li class="td-highlight">
                <span class="td-hl-no">${h.no}</span>
                <span class="td-hl-text">${escapeHtml(h.text)}</span>
              </li>`).join('')}
          </ol>
        </section>` : ''}

      ${paragraphs.length ? `
        <section class="td-section">
          <h3 class="td-section-title">${icon('fileText', 17)} 完整转写内容</h3>
          <div class="td-text">
            ${paragraphs.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
          </div>
        </section>` : ''}

      ${todos.length ? `
        <section class="td-section">
          <h3 class="td-section-title">${icon('checkSquare', 17)} 待办事项
            <span class="td-section-count">${todos.filter((t) => !t.done).length} 项待完成</span>
          </h3>
          <ul class="td-todos"></ul>
        </section>` : ''}

      <div class="td-actions">
        <button class="td-act" data-act="copy">${icon('copy', 16)} 复制全文</button>
        <button class="td-act is-danger" data-act="delete">${icon('trash', 16)} 删除记录</button>
      </div>
    </div>
  `;

  bindBack(page, '#/history');

  /* ---------- 待办勾选 ---------- */
  const todosEl = page.querySelector('.td-todos');

  function renderTodos() {
    if (!todosEl) return;
    todosEl.innerHTML = todos.map((t, i) => `
      <li class="td-todo ${t.done ? 'is-done' : ''}" data-idx="${i}">
        <button class="td-check" aria-label="${t.done ? '取消完成' : '标记完成'}"
                aria-pressed="${t.done}">
          ${t.done ? icon('check', 13) : ''}
        </button>
        <span class="td-todo-text">${escapeHtml(t.text)}</span>
      </li>`).join('');

    todosEl.querySelectorAll('.td-check').forEach((btn) => {
      btn.addEventListener('click', () => {
        const li = btn.closest('.td-todo');
        const idx = Number(li.dataset.idx);
        todos[idx].done = !todos[idx].done;
        persistTodos();
        renderTodos();
        const countEl = page.querySelector('.td-section-count');
        if (countEl) countEl.textContent = `${todos.filter((t) => !t.done).length} 项待完成`;
      });
    });
  }

  /** 待办状态写回记录库，刷新后仍然保留 */
  function persistTodos() {
    saves.update(record.id, { payload: { ...p, todos } });
  }

  renderTodos();

  /* ---------- 底部操作 ---------- */
  const fullText = () => [
    record.title || '',
    p.summary ? `【AI 总结】\n${p.summary}` : '',
    p.highlights?.length
      ? `【会议重点】\n${p.highlights.map((h) => `${h.no}. ${h.text}`).join('\n')}` : '',
    p.text ? `【完整转写】\n${p.text}` : '',
    todos.length
      ? `【待办事项】\n${todos.map((t) => `${t.done ? '[x]' : '[ ]'} ${t.text}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n');

  page.querySelector('[data-act="copy"]')?.addEventListener('click', async () => {
    const ok = await copyText(fullText());
    showToast(ok ? '已复制转写全文' : '复制失败，请长按手动选择');
  });

  page.querySelector('[data-act="delete"]')?.addEventListener('click', () => {
    showConfirm({
      title: '删除该转写记录？',
      message: '删除后无法恢复，AI 总结与待办事项将一并移除。',
      okText: '确认删除',
      onConfirm: () => {
        saves.remove(record.id);
        showToast('已删除转写记录');
        location.hash = '#/history';
      },
    });
  });

  return page;
}
