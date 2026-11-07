/* ============================================================
   统一语言数据 — 所有页面的语言信息唯一数据源
   group: common 常用 / asia 亚洲 / europe 欧洲
   ============================================================ */

/** 全部支持的语言（Mock，后续接入真实语言列表时仅替换本文件） */
export const LANGUAGES = {
  // 常用
  'zh-CN': { code: 'zh-CN', name: '中文普通话', native: '中文普通话', flag: 'zh', group: 'common' },
  'en-US': { code: 'en-US', name: '英语（美国）', native: 'English', flag: 'us', group: 'common' },
  'ja-JP': { code: 'ja-JP', name: '日语',       native: '日本語',   flag: 'jp', group: 'common' },
  'ko-KR': { code: 'ko-KR', name: '韩语',       native: '한국어',   flag: 'kr', group: 'common' },
  // 亚洲
  'th-TH': { code: 'th-TH', name: '泰语',       native: 'ไทย',               flag: 'th', group: 'asia' },
  'id-ID': { code: 'id-ID', name: '印尼语',     native: 'Bahasa Indonesia',  flag: 'id', group: 'asia' },
  'ms-MY': { code: 'ms-MY', name: '马来语',     native: 'Bahasa Melayu',     flag: 'my', group: 'asia' },
  'fil-PH':{ code: 'fil-PH',name: '菲律宾语',   native: 'Filipino',          flag: 'ph', group: 'asia' },
  // 欧洲
  'fr-FR': { code: 'fr-FR', name: '法语',       native: 'Français',  flag: 'fr', group: 'europe' },
  'de-DE': { code: 'de-DE', name: '德语',       native: 'Deutsch',   flag: 'de', group: 'europe' },
  'es-ES': { code: 'es-ES', name: '西班牙语',   native: 'Español',   flag: 'es', group: 'europe' },
  'it-IT': { code: 'it-IT', name: '意大利语',   native: 'Italiano',  flag: 'it', group: 'europe' },
};

/** 语言分组顺序与展示名 */
export const LANGUAGE_GROUPS = [
  { id: 'common', title: '⭐ 常用语言', codes: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'] },
  { id: 'asia',   title: '🌏 亚洲语言', codes: ['th-TH', 'id-ID', 'ms-MY', 'fil-PH'] },
  { id: 'europe', title: '🌍 欧洲语言', codes: ['fr-FR', 'de-DE', 'es-ES', 'it-IT'] },
];

/** 默认最近使用（首次启动 Mock） */
export const DEFAULT_RECENT = ['ja-JP', 'ko-KR'];

/** 全部语言（数组，便于搜索） */
export const ALL_LANGUAGES = Object.values(LANGUAGES);
