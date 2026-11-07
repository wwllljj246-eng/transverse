/* 通知中心数据层 — localStorage 持久化 + 订阅联动 */
const STORAGE_KEY = 'transverse_notifications_v1';
const SEED_FLAG_KEY = 'transverse_notifications_seeded_v1';
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const SEEDS = [
  { id: 'n1', type: 'translate', icon: 'image', title: '翻译完成',
    body: '你的图片翻译已经完成', timeText: '19:24', read: false,
    route: '#/history', ts: Date.now() - 40 * MIN },
  { id: 'n2', type: 'ai', icon: 'sparkles', title: 'AI 表达优化',
    body: '已为你生成更自然的表达', timeText: '18:42', read: false,
    route: '#/translate', ts: Date.now() - 120 * MIN },
  { id: 'n3', type: 'system', icon: 'info', title: '功能更新',
    body: '译境新增实时转写功能', timeText: '昨天', read: false,
    route: '#/feature/transcribe', ts: Date.now() - DAY },
  { id: 'n4', type: 'translate', icon: 'fileText', title: '转写完成',
    body: '本次实时转写内容已经生成', timeText: '昨天', read: true,
    route: '#/history', ts: Date.now() - DAY - 60 * MIN },
];

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function persist(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/** 订阅列表（首页铃铛 / 通知页共用，数据变更时回调） */
const listeners = new Set();
function notify() { listeners.forEach((fn) => { try { fn(); } catch { /* ignore */ } }); }

export const notifications = {
  seedIfEmpty() {
    if (localStorage.getItem(SEED_FLAG_KEY)) return;
    if (!load().length) persist(SEEDS);
    try { localStorage.setItem(SEED_FLAG_KEY, '1'); } catch { /* ignore */ }
  },
  list() { return load(); },
  unreadCount() { return load().filter((n) => !n.read).length; },

  markRead(id) {
    const list = load();
    const item = list.find((n) => n.id === id);
    if (item && !item.read) { item.read = true; persist(list); notify(); }
  },

  markAllRead() {
    const list = load();
    if (!list.some((n) => !n.read)) return;
    list.forEach((n) => { n.read = true; });
    persist(list);
    notify();
  },

  reset(items) {
    persist(items || SEEDS);
    notify();
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
