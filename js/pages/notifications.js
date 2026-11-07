/* 通知中心 — 分类 Tab / 通知列表 / 全部已读 / 空状态 */
import { notifications } from '../data/notifications.js';
import { icon } from '../components/icons.js';
import { navBar, segTabs, emptyState } from '../components/ui.js';
import { escapeHtml, bindBack } from '../utils/dom.js';
import { showToast } from '../components/toast.js';

const CATS = [
  { id: 'all', label: '全部' },
  { id: 'system', label: '系统' },
  { id: 'translate', label: '翻译' },
  { id: 'ai', label: 'AI' },
];

export default function NotificationsPage() {
  let activeCat = 'all';
  const page = document.createElement('div');
  page.className = 'page';
  page.innerHTML = `
    ${navBar('通知', '#/')}
    <div class="notif-toolbar page-pad">
      ${segTabs(CATS, activeCat)}
      <button class="notif-read-all" id="notif-read-all">全部已读</button>
    </div>
    <div class="notif-list page-pad" id="notif-list"></div>
  `;

  const listEl = page.querySelector('#notif-list');
  const readAllBtn = page.querySelector('#notif-read-all');
  bindBack(page, '#/');

  function render() {
    const all = notifications.list();
    const items = activeCat === 'all' ? all : all.filter((n) => n.type === activeCat);
    readAllBtn.disabled = notifications.unreadCount() === 0;
    readAllBtn.classList.toggle('is-disabled', readAllBtn.disabled);
    if (!items.length) {
      listEl.innerHTML = emptyState({
        icon: 'bell', title: '暂无通知',
        sub: '重要的翻译和系统提醒会显示在这里',
      });
      return;
    }
    listEl.innerHTML = items.map((n) => `
      <button class="notif-item ${n.read ? '' : 'is-unread'}" data-id="${n.id}">
        <span class="notif-ico">${icon(n.icon || 'bell', 20)}</span>
        <span class="notif-main">
          <span class="notif-title">${escapeHtml(n.title)}</span>
          <span class="notif-body">${escapeHtml(n.body)}</span>
        </span>
        <span class="notif-side">
          <span class="notif-time">${escapeHtml(n.timeText)}</span>
          ${n.read ? '' : '<span class="notif-dot"></span>'}
        </span>
      </button>`).join('');
  }

  page.querySelector('.notif-toolbar').addEventListener('click', (e) => {
    const tab = e.target.closest('.seg-tab');
    if (!tab || tab.dataset.tab === activeCat) return;
    activeCat = tab.dataset.tab;
    page.querySelectorAll('.seg-tab').forEach((el) => {
      const on = el.dataset.tab === activeCat;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', String(on));
    });
    render();
  });

  listEl.addEventListener('click', (e) => {
    const item = e.target.closest('.notif-item');
    if (!item) return;
    const n = notifications.list().find((x) => x.id === item.dataset.id);
    notifications.markRead(item.dataset.id);
    render();
    if (n && n.route) location.hash = n.route;
  });

  readAllBtn.addEventListener('click', () => {
    notifications.markAllRead();
    render();
    showToast('已全部标记为已读');
  });

  render();
  return page;
}
