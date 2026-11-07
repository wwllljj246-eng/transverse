/* ============================================================
   应用引导 — 挂载外壳、监听路由、渲染页面 + 底部导航
   ============================================================ */

import { resolve } from './router.js';
import { TabBar } from './components/tabbar.js';
import { settings } from './data/settings.js';
import { markVisited } from './utils/dom.js';

// 应用用户主题 / 字号（在渲染前执行，避免闪烁）
settings.init();

const app = document.getElementById('app');

let currentTab = null;

/** 执行页面/组件注册的卸载回调（取消订阅、定时器、语音识别等） */
function unload(root) {
  root?._onUnload?.();
  root?.querySelectorAll('*').forEach((el) => el._onUnload?.());
}

function render() {
  const match = resolve();
  // 未匹配路由 → 回首页
  if (!match) {
    location.hash = '#/';
    return;
  }

  const { page, tab } = match.make(match.params);

  // 路由变化时重建导航栏以更新高亮；tab==='keep' 时保持不变
  if (tab !== 'keep' && tab !== currentTab) {
    document.querySelector('.tab-bar')?.remove();
    app.appendChild(TabBar(tab));
    currentTab = tab;
  }

  // 清理旧页面，再插入新页面
  const oldPage = app.querySelector('.page');
  if (oldPage) {
    unload(oldPage);
    oldPage.replaceWith(page);
  } else {
    app.insertBefore(page, app.firstChild);
  }

  window.scrollTo(0, 0);
}

// 记录"本次会话内已发生过跳转"，供 utils/dom.js 的 goBack 判断能否回退浏览器历史
window.addEventListener('hashchange', () => {
  markVisited();
  render();
});

// 首次挂载：无 hash 时先设置为首页路由
if (!location.hash) location.hash = '#/';
else render();
