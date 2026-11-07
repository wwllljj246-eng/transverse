/* ============================================================
   通用工具模块 — 全项目唯一的实现源
   此前 escapeHtml / formatTime 在 history、profile、camera 等
   多个页面各写一份，第五阶段统一到这里，各页面直接 import。
   ============================================================ */

/** HTML 转义，所有拼接进 innerHTML 的用户内容都必须过一遍 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const pad2 = (n) => String(n).padStart(2, '0');

/** 当天 00:00 的时间戳（用于按天分组） */
export function startOfDay(input) {
  const d = input instanceof Date ? input : new Date(input);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 日期分组名：今天 / 昨天 / M月D日 / YYYY年M月D日 */
export function dayLabel(ts) {
  if (!ts) return '';
  const today = startOfDay(Date.now());
  const day = startOfDay(ts);
  const DAY = 86400000;
  if (day === today) return '今天';
  if (day === today - DAY) return '昨天';
  const d = new Date(ts);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return sameYear
    ? `${d.getMonth() + 1}月${d.getDate()}日`
    : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 记录卡时间：今天 14:05 / 昨天 09:30 / 09-12 21:40 */
export function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const label = dayLabel(ts);
  if (label === '今天') return `今天 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  if (label === '昨天') return `昨天 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 完整时间：2026-09-16 14:05 */
export function formatFullTime(ts) {
  const d = new Date(ts || Date.now());
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 时长 mm:ss（同传/转写计时用） */
export function formatDuration(ms) {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/** 字符数 / 词数统计，用于转写卡信息 */
export function charCount(text) {
  return (text || '').replace(/\s/g, '').length;
}

/**
 * 复制文本到剪贴板
 * 优先 navigator.clipboard，非安全上下文（http 局域网）降级 execCommand
 * @returns {Promise<boolean>} 是否复制成功
 */
export async function copyText(text) {
  const value = String(text ?? '');
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch { /* 继续走降级方案 */ }

  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

const VISITED_KEY = 'transverse_visited_v1';

/** 标记"本次会话内已发生过页面跳转"，由 main.js 在路由变化时调用 */
export function markVisited() {
  try { sessionStorage.setItem(VISITED_KEY, '1'); } catch { /* ignore */ }
}

/**
 * 统一返回行为
 * - 会话内已有跳转记录 → 回退浏览器历史（保留来路，如从拍照页进语言选择）
 * - 直接深链进入（如刷新在 #/transcript/xxx）→ 跳转 fallback，避免退出应用
 * @param {string} fallback 兜底路由
 */
export function goBack(fallback = '#/') {
  let visited = false;
  try { visited = sessionStorage.getItem(VISITED_KEY) === '1'; } catch { /* ignore */ }
  if (visited && window.history.length > 1) {
    history.back();
    return;
  }
  location.hash = fallback;
}

/** 给 root 内所有 [data-back] 元素绑定统一返回 */
export function bindBack(root, fallback = '#/') {
  root.querySelectorAll('[data-back]').forEach((el) => {
    const target = el.dataset.back || fallback;
    el.addEventListener('click', () => goBack(target));
  });
}

/**
 * 分段控件 / 选项组通用高亮切换（按 data-* 值）
 * 全项目所有"模式切换 / 选项组"统一走这里，避免各页面各写一遍 toggle
 * @param {Element} root 作用域
 * @param {string} selector 选项选择器，如 '.mode-chip'
 * @param {string} dataKey dataset 键名，如 'mode'
 * @param {string} value 需要高亮的值
 */
export function setActiveBy(root, selector, dataKey, value) {
  root.querySelectorAll(selector).forEach((el) => {
    el.classList.toggle('is-active', el.dataset[dataKey] === value);
  });
}
