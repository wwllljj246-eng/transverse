/* ============================================================
   用户设置 — 主题 / 字体大小 / 翻译设置 / 默认 AI 语气 / 我的语言 / 清空记录

   主题：light | dark | system
   修复：旧实现中「浅色」是 removeAttribute('data-theme')，而 CSS 的深色
   规则写成 html:not([data-theme="light"])，导致系统为深色时手动选浅色
   会被系统色覆盖。现在始终写入明确的 light/dark，并支持 system 动态跟随。
   ============================================================ */

import { saves } from './saves.js';
import { favorites } from './favorites.js';
import { notifications } from './notifications.js';
import { store } from '../store.js';

const THEME_KEY = 'transverse_theme_v1';
const TONE_KEY = 'transverse_default_tone_v1';
const FONT_KEY = 'transverse_font_size_v1';
const AUTODETECT_KEY = 'transverse_auto_detect_v1';
const AUTOPLAY_KEY = 'transverse_auto_play_v1';
const DEFAULT_LANG_KEY = 'transverse_default_lang_v1';
const USER_NAME_KEY = 'transverse_user_name_v1';

/** 主题色（与 design-system.css 的 --bg-page 保持一致） */
const THEME_COLOR = { light: '#F3F0EC', dark: '#232830' };

/** 字体大小档位：scale 映射到 CSS 变量 --fs-scale */
export const FONT_SIZES = [
  { id: 'small',    name: '小',   scale: 0.92, desc: '一屏显示更多内容' },
  { id: 'standard', name: '标准', scale: 1.0,  desc: '默认字号，推荐' },
  { id: 'large',    name: '大',   scale: 1.12, desc: '字更大，阅读更省力' },
];

export const THEMES = [
  { id: 'light',  name: '浅色模式', icon: 'sun',       desc: '始终使用浅色外观' },
  { id: 'dark',   name: '深色模式', icon: 'moon',      desc: '始终使用深色外观' },
  { id: 'system', name: '跟随系统', icon: 'autoTheme', desc: '随系统深浅色自动切换' },
];

let mediaListener = null;

const read = (key, fallback = '') => {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* 存储不可用时静默降级 */ }
};

function readTheme() {
  /* 演示/验收用：?theme=light|dark 查询参数优先级最高（与 index.html 引导脚本一致） */
  try {
    const q = new URLSearchParams(location.search).get('theme');
    if (q === 'light' || q === 'dark') return q;
  } catch { /* ignore */ }
  const t = read(THEME_KEY);
  return THEMES.find((x) => x.id === t) ? t : 'light';
}

function readTone() {
  return read(TONE_KEY) || 'natural';
}

function readFont() {
  const f = read(FONT_KEY);
  return FONT_SIZES.find((x) => x.id === f) ? f : 'standard';
}

function readBool(key, def) {
  const v = read(key);
  if (v === '1') return true;
  if (v === '0') return false;
  return def;
}

function systemIsDark() {
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

/** 把设置解析为实际生效的 light / dark */
export function effectiveTheme(setting = readTheme()) {
  if (setting === 'system') return systemIsDark() ? 'dark' : 'light';
  return setting === 'dark' ? 'dark' : 'light';
}

/** 应用主题：始终写入明确的 light/dark，并同步 theme-color */
function applyThemeToHtml() {
  const resolved = effectiveTheme();
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLOR[resolved]);
}

function applyFontToHtml() {
  document.documentElement.setAttribute('data-font', readFont());
}

function readRecentLangs() {
  return store.get().recent.map((l) => l.code);
}

export const settings = {
  /** 当前主题设置（light / dark / system） */
  get theme() { return readTheme(); },

  /** 实际生效的浅色/深色 */
  get resolvedTheme() { return effectiveTheme(); },

  /** 默认 AI 语气 id */
  get defaultTone() { return readTone(); },

  /** 字体大小 id */
  get fontSize() { return readFont(); },

  /** 自动检测语言 */
  get autoDetect() { return readBool(AUTODETECT_KEY, true); },

  /** 自动播放译文 */
  get autoPlay() { return readBool(AUTOPLAY_KEY, false); },

  /** 默认目标语言 */
  get defaultLang() { return read(DEFAULT_LANG_KEY) || 'en-US'; },

  /** 用户名（「我的」页展示） */
  get userName() { return read(USER_NAME_KEY) || 'Yang'; },

  /** 最近使用语言（「我的语言」页管理） */
  get recentLangs() { return readRecentLangs(); },

  /** 初始化：灌种子 + 应用主题/字体 + 监听系统色变化 */
  init() {
    try {
      saves.seedIfEmpty();
      favorites.seedIfEmpty();
      notifications.seedIfEmpty();
    } catch { /* 种子失败不阻断启动 */ }

    applyThemeToHtml();
    applyFontToHtml();

    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => { if (readTheme() === 'system') applyThemeToHtml(); };
      mediaListener = handler;
      if (mq.addEventListener) mq.addEventListener('change', handler);
      else if (mq.addListener) mq.addListener(handler);
    }
  },

  applyTheme: applyThemeToHtml,
  applyFontSize: applyFontToHtml,

  /** 切换主题设置 */
  setTheme(theme) {
    if (!THEMES.find((x) => x.id === theme)) return;
    write(THEME_KEY, theme);
    applyThemeToHtml();
  },

  /** 设置字体大小 */
  setFontSize(size) {
    if (!FONT_SIZES.find((x) => x.id === size)) return;
    write(FONT_KEY, size);
    applyFontToHtml();
  },

  setDefaultTone(tone) { write(TONE_KEY, tone); },
  setAutoDetect(v) { write(AUTODETECT_KEY, v ? '1' : '0'); },
  setAutoPlay(v) { write(AUTOPLAY_KEY, v ? '1' : '0'); },
  setDefaultLang(code) { write(DEFAULT_LANG_KEY, code); },
  setUserName(name) { write(USER_NAME_KEY, String(name || '').trim() || 'Yang'); },

  /* ---------- 我的语言 ----------
     与语言选择页的「最近使用」共用 js/store.js 里的同一份数据，
     不再各自维护一份 localStorage（此前两个 key 互不同步）。 */

  /** 加入最近使用（去重、置顶） */
  addRecentLang(code) {
    store.addRecent(code);
  },

  /** 移除最近使用 */
  removeRecentLang(code) {
    store.removeRecent(code);
  },

  /* ---------- 数据 ---------- */

  /** 清空所有保存的记录（翻译 / 拍照 / 同传 / 转写 + 收藏） */
  clearAll() {
    saves.clear();
    favorites.clear();
    // 不清除种子标记，避免 Mock 数据再次灌入覆盖用户的"清空"意图
  },

  /** 记录总数（历史 + 转写 + 收藏） */
  totalRecords() {
    return saves.list().length + favorites.list().length;
  },

  /** 历史记录数（不含收藏） */
  historyCount() {
    return saves.list().length;
  },

  /** 收藏数 */
  favoriteCount() {
    return favorites.list().length;
  },

  /** 卸载时移除监听 */
  destroy() {
    if (mediaListener && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.removeEventListener) mq.removeEventListener('change', mediaListener);
      else if (mq.removeListener) mq.removeListener(mediaListener);
      mediaListener = null;
    }
  },
};
