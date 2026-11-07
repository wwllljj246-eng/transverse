/* ============================================================
   全局状态 — 语言对 / 最近使用 / 语言收藏（localStorage 持久化）
   轻量发布/订阅；emit 携带 action，供页面区分变化来源
   ============================================================ */

import { LANGUAGES, DEFAULT_RECENT } from './data/languages.js';

const RECENT_KEY = 'transverse_recent_v1';
const LANG_FAV_KEY = 'transverse_lang_favs_v1';

/** 最近使用语言上限（语言选择页「最近使用」与「我的语言」共用同一份数据） */
const RECENT_MAX = 6;

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 存储不可用时静默降级 */
  }
}

const state = {
  source: 'zh-CN',
  target: 'en-US',
  recent: readJSON(RECENT_KEY, [...DEFAULT_RECENT]).filter((c) => LANGUAGES[c]),
  langFavs: new Set(readJSON(LANG_FAV_KEY, [])),
};

const listeners = new Set();

function emit(action) {
  listeners.forEach((fn) => fn(snapshot(), action));
}

function snapshot() {
  return {
    source: LANGUAGES[state.source],
    target: LANGUAGES[state.target],
    recent: state.recent.map((c) => LANGUAGES[c]).filter(Boolean),
    langFavs: new Set(state.langFavs),
  };
}

/** 去重、置顶、截断后持久化（内部使用，不通知订阅者） */
function pushRecent(code) {
  state.recent = [code, ...state.recent.filter((c) => c !== code)].slice(0, RECENT_MAX);
  writeJSON(RECENT_KEY, state.recent);
}

export const store = {
  get: snapshot,

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /** 交换源/目标语言 */
  swap() {
    [state.source, state.target] = [state.target, state.source];
    emit('swap');
  },

  /** 设置某一侧语言，并写入最近使用 */
  setLang(side, code) {
    if (!LANGUAGES[code] || state[side] === code) return;
    state[side] = code;
    pushRecent(code);
    emit('set');
  },

  /** 加入最近使用（去重、置顶） */
  addRecent(code) {
    if (!LANGUAGES[code] || state.recent[0] === code) return;
    pushRecent(code);
    emit('recent');
  },

  /** 移出最近使用 */
  removeRecent(code) {
    const next = state.recent.filter((c) => c !== code);
    if (next.length === state.recent.length) return;
    state.recent = next;
    writeJSON(RECENT_KEY, state.recent);
    emit('recent');
  },

  /** 切换语言收藏（语言选择页的星标） */
  toggleLangFav(code) {
    if (state.langFavs.has(code)) state.langFavs.delete(code);
    else state.langFavs.add(code);
    writeJSON(LANG_FAV_KEY, [...state.langFavs]);
    emit('fav');
  },
};
