/* ============================================================
   离线语言包 — Mock 数据 + 下载状态持久化
   真实版本接入时，download() 内部替换为模型文件下载 + IndexedDB 存储
   本文件对外接口保持不变，页面无需改动。
   ============================================================ */

import { LANGUAGES } from './languages.js';

const STORAGE_KEY = 'transverse_offline_packs_v1';

/** 可离线使用的语言包清单（体积为 Mock 值） */
export const OFFLINE_PACKS = [
  { code: 'en-US', size: '48 MB',  level: '完整包' },
  { code: 'ja-JP', size: '52 MB',  level: '完整包' },
  { code: 'ko-KR', size: '45 MB',  level: '完整包' },
  { code: 'zh-CN', size: '38 MB',  level: '完整包' },
  { code: 'fr-FR', size: '56 MB',  level: '完整包' },
  { code: 'de-DE', size: '58 MB',  level: '完整包' },
  { code: 'es-ES', size: '54 MB',  level: '完整包' },
  { code: 'it-IT', size: '51 MB',  level: '完整包' },
  { code: 'th-TH', size: '43 MB',  level: '完整包' },
  { code: 'id-ID', size: '41 MB',  level: '完整包' },
  { code: 'ms-MY', size: '40 MB',  level: '完整包' },
  { code: 'fil-PH', size: '39 MB', level: '完整包' },
];

/** 首次安装即预置的语言包 */
const PRESET_DOWNLOADED = ['zh-CN', 'en-US'];

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(raw)) return raw;
  } catch { /* 回落默认 */ }
  return [...PRESET_DOWNLOADED];
}

function save(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export const offlinePacks = {
  /** 全部语言包 + 语言展示信息 + 下载状态 */
  all() {
    const done = load();
    return OFFLINE_PACKS.map((p) => {
      const lang = LANGUAGES[p.code] || {};
      return {
        ...p,
        name: lang.name || p.code,
        native: lang.native || p.code,
        flag: lang.flag || 'us',
        downloaded: done.includes(p.code),
      };
    });
  },

  /** 已下载列表 */
  downloaded() {
    return this.all().filter((p) => p.downloaded);
  },

  /** 未下载列表 */
  available() {
    return this.all().filter((p) => !p.downloaded);
  },

  isDownloaded(code) {
    return load().includes(code);
  },

  /** 已下载包总占用（用于「我的」页展示） */
  totalSizeText() {
    const list = this.downloaded();
    const total = list.reduce((sum, p) => sum + (parseInt(p.size, 10) || 0), 0);
    return `${total} MB`;
  },

  /** 标记为已下载 */
  markDownloaded(code) {
    const list = load();
    if (!list.includes(code)) save([...list, code]);
  },

  /** 删除离线包 */
  remove(code) {
    save(load().filter((c) => c !== code));
  },

  /** 恢复默认（设置页"重置"用） */
  reset() {
    save([...PRESET_DOWNLOADED]);
  },
};
