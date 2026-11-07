/* ============================================================
   记录类型元信息 — 全站唯一定义源
   此前类型标签/图标散落在 history.js，且种子数据用 'transcript'
   而运行时写入用 'transcribe'，导致筛选与标签不一致，这里统一收敛。
   ============================================================ */

/**
 * label  展示名
 * icon   icons.js 中的图标名
 * badge  对应 css/profile.css 的 .hist-badge-* 配色
 * group  history=历史 Tab  |  transcript=转写 Tab
 */
const RECORD_TYPES = {
  text:        { label: '文本翻译', icon: 'translate', badge: 'text',        group: 'history' },
  photo:       { label: '拍照翻译', icon: 'camera',    badge: 'photo',       group: 'history' },
  interpreter: { label: '同声传译', icon: 'mic',       badge: 'interpreter', group: 'history' },
  transcribe:  { label: '实时转写', icon: 'fileText',  badge: 'transcribe',  group: 'transcript' },
  summary:     { label: 'AI 整理',  icon: 'sparkles',  badge: 'summary',     group: 'transcript' },
};

/** 历史 Tab 展示的类型（文本翻译 / 拍照翻译 / 同声传译） */
export const HISTORY_TYPES = ['text', 'photo', 'interpreter'];

/** 转写 Tab 展示的类型 */
export const TRANSCRIPT_TYPES = ['transcribe', 'summary'];

/** 转写分类：会议 / 课程 / 演讲 */
export const TRANSCRIPT_CATEGORIES = {
  meeting: { label: '会议记录', icon: 'chat',      emoji: '💼' },
  class:   { label: '课程记录', icon: 'fileText',  emoji: '🎓' },
  speech:  { label: '演讲记录', icon: 'mic',       emoji: '🎤' },
};

/** 归一化历史遗留类型（transcript → transcribe） */
export function normalizeType(type) {
  return type === 'transcript' ? 'transcribe' : type;
}

const FALLBACK = { label: '记录', icon: 'list', badge: 'text', group: 'history' };

/** 取类型元信息，未知类型返回兜底值 */
export function typeMeta(type) {
  return RECORD_TYPES[normalizeType(type)] || FALLBACK;
}

/** 取转写分类元信息 */
export function categoryMeta(category) {
  return TRANSCRIPT_CATEGORIES[category] || TRANSCRIPT_CATEGORIES.meeting;
}
