/* ============================================================
   首页 / 导航 Mock 数据
   语言数据见 data/languages.js；翻译数据见 data/translation-mock.js
   ============================================================ */

/** 六大核心功能 */
export const FEATURES = [
  { id: 'text',       icon: 'translate', title: '文本翻译',   desc: '输入文字，秒级精准互译' },
  { id: 'camera',     icon: 'camera',    title: '拍照翻译',   desc: '对准菜单路牌，即拍即译' },
  { id: 'interpreter',icon: 'mic',       title: '同声传译',   desc: 'AI 同传，边说边译不间断' },
  { id: 'transcribe', icon: 'fileText',  title: '实时转写',   desc: '语音实时转文字并翻译' },
  { id: 'dialogue',   icon: 'chat',      title: '面对面对话', desc: '双人对话，双向自动翻译' },
  { id: 'subtitle',   icon: 'subtitle',  title: '悬浮字幕',   desc: '屏幕悬浮字幕，跨 App 可用' },
];

/** 场景推荐 */
export const SCENES = [
  { id: 'travel',    emoji: '✈️', title: '旅行', desc: '出行问路点单全搞定' },
  { id: 'study',     emoji: '🎓', title: '学习', desc: '外语学习与文献阅读' },
  { id: 'business',  emoji: '💼', title: '商务', desc: '会议谈判邮件更从容' },
  { id: 'entertainment', emoji: '🎬', title: '娱乐', desc: '追剧刷视频无字幕门槛' },
];

/** 底部导航 */
export const TABS = [
  { id: 'home',      label: '首页', icon: 'home',     path: '#/' },
  { id: 'translate', label: '翻译', icon: 'globe',    path: '#/translate' },
  { id: 'live',      label: '实时', icon: 'mic',      path: '#/live' },
  { id: 'history',   label: '记录', icon: 'history',  path: '#/history' },
  { id: 'profile',   label: '我的', icon: 'user',     path: '#/profile' },
];
