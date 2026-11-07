/* ============================================================
   翻译收藏数据 — localStorage 持久化
   结构：{ id, from, to, tone, sourceText, text, ts }
   第五阶段：新增 seedIfEmpty() 灌入 Mock 收藏
   ============================================================ */

import { FAVORITES_SEEDS } from './history-seed.js';

const STORAGE_KEY = 'transverse_favorites_v1';
const SEED_FLAG_KEY = 'transverse_fav_seeded_v1';

/** djb2 字符串哈希，生成稳定收藏 id */
function hashStr(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return 'f' + (hash >>> 0);
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* 存储不可用时静默降级 */
  }
}

export const favorites = {
  /** 根据翻译内容生成稳定 id */
  idFor({ from, to, tone, sourceText, text }) {
    return hashStr(`${from}|${to}|${tone}|${sourceText}|${text}`);
  },

  /** 首次启动灌入 Mock 收藏（仅执行一次） */
  seedIfEmpty() {
    const seeded = localStorage.getItem(SEED_FLAG_KEY);
    if (seeded) return;
    const list = load();
    if (!list.length) {
      save(FAVORITES_SEEDS);
    }
    try { localStorage.setItem(SEED_FLAG_KEY, '1'); } catch { /* ignore */ }
  },

  list() {
    return load();
  },

  has(item) {
    const id = this.idFor(item);
    return load().some((f) => f.id === id);
  },

  /** 按 id 取单条 */
  get(id) {
    return load().find((f) => f.id === id) || null;
  },

  /** 按 id 直接删除（记录页删除收藏用；旧实现靠 toggle 传回原对象，易出错） */
  remove(id) {
    const list = load().filter((f) => f.id !== id);
    save(list);
  },

  /** 清空全部收藏 */
  clear() {
    save([]);
  },

  /**
   * 切换收藏
   * @returns {boolean} true=已收藏 false=已取消
   */
  toggle(item) {
    const id = this.idFor(item);
    const list = load();
    const idx = list.findIndex((f) => f.id === id);
    if (idx >= 0) {
      list.splice(idx, 1);
      save(list);
      return false;
    }
    list.unshift({ ...item, id, ts: Date.now() });
    save(list);
    return true;
  },
};
