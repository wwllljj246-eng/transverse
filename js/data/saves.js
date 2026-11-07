/* ============================================================
   统一保存管理 — 所有翻译产物入库（localStorage，按时间倒序）
   类型定义见 data/type-meta.js：text / photo / interpreter / transcribe / summary
   第五阶段：补齐 update()（待办勾选等局部更新），并统一历史遗留的
   'transcript' 类型为 'transcribe'
   ============================================================ */

import { SAVES_SEEDS } from './history-seed.js';
import { normalizeType } from './type-meta.js';

const STORAGE_KEY = 'transverse_saves_v1';
const SEED_FLAG_KEY = 'transverse_seeded_v1';

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

/** 生成稳定 id：f + 时间戳 + 随机后缀 */
function genId() {
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const saves = {
  /** 全部记录（时间倒序，类型已归一化） */
  list() {
    return load().map((r) => ({ ...r, type: normalizeType(r.type) }));
  },

  /** 首次启动时灌入 Mock 种子数据（仅执行一次） */
  seedIfEmpty() {
    const seeded = localStorage.getItem(SEED_FLAG_KEY);
    if (seeded) return;
    const list = load();
    if (!list.length) {
      save(SAVES_SEEDS);
    }
    try { localStorage.setItem(SEED_FLAG_KEY, '1'); } catch { /* ignore */ }
  },

  /** 按 id 取单条 */
  get(id) {
    const raw = load().find((r) => r.id === id);
    return raw ? { ...raw, type: normalizeType(raw.type) } : null;
  },

  /** 按 id 局部更新（如待办勾选状态） */
  update(id, patch) {
    const list = load();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...patch, id };
    save(list);
    return list[idx];
  },

  /** 删除一条 */
  remove(id) {
    const list = load().filter((r) => r.id !== id);
    save(list);
  },

  /** 清空 */
  clear() {
    save([]);
  },

  /**
   * 新增一条保存
   * @param {{type: string, title: string, payload: any}} record
   * @returns {object} 已保存的记录（含 id、ts）
   */
  add(record) {
    const item = { ...record, id: genId(), ts: Date.now() };
    const list = load();
    list.unshift(item);
    save(list);
    return item;
  },
};
