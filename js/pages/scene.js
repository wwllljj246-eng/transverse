/* ============================================================
   场景模式页 — 旅行 / 学习 / 商务 / 娱乐
   统一组件：根据 scene id 渲染对应功能推荐卡
   所有功能按钮直接跳转到已有功能页面（不重复创建）
   ============================================================ */

import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';

/** 场景配置：每个场景的功能推荐（path 指向已有路由） */
const SCENE_CONFIG = {
  travel: {
    emoji: '✈️',
    title: '旅行',
    desc: '出行问路点单全搞定',
    gradient: 'linear-gradient(135deg, #4F7CFF 0%, #38BDF8 100%)',
    features: [
      { id: 'camera',     icon: 'camera',    title: '拍照翻译',   desc: '对准菜单路牌，即拍即译', path: '#/feature/camera' },
      { id: 'menu',       icon: 'image',     title: '菜单翻译',   desc: '拍照识别菜单并翻译',       path: '#/feature/camera' },
      { id: 'dialogue',   icon: 'chat',      title: '面对面对话', desc: '双人对话双向自动翻译',     path: '#/feature/dialogue' },
    ],
  },
  study: {
    emoji: '🎓',
    title: '学习',
    desc: '外语学习与文献阅读',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    features: [
      { id: 'interpreter', icon: 'mic',       title: '同声传译',   desc: 'AI 同传边说边译',         path: '#/feature/interpreter' },
      { id: 'subtitle',    icon: 'subtitle',  title: '实时字幕',   desc: '屏幕悬浮字幕跨 App 可用', path: '#/feature/subtitle' },
      { id: 'vocab',       icon: 'star',      title: '单词收藏',   desc: '收藏常用单词和句子',       path: '#/translate' },
    ],
  },
  business: {
    emoji: '💼',
    title: '商务',
    desc: '会议谈判邮件更从容',
    gradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
    features: [
      { id: 'interpreter', icon: 'mic',       title: 'AI 同声传译', desc: '会议实时双向翻译',       path: '#/feature/interpreter' },
      { id: 'transcribe',  icon: 'fileText',  title: '实时转写',     desc: '语音实时转文字',         path: '#/feature/transcribe' },
      { id: 'summary',     icon: 'sparkles',  title: 'AI 会议总结', desc: '一键生成重点与待办',     path: '#/feature/transcribe' },
    ],
  },
  entertainment: {
    emoji: '🎬',
    title: '娱乐',
    desc: '追剧刷视频无字幕门槛',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    features: [
      { id: 'subtitle', icon: 'subtitle',  title: '悬浮字幕',   desc: '追剧实时字幕',         path: '#/feature/subtitle' },
      { id: 'video',    icon: 'image',     title: '视频字幕',   desc: '为视频生成双语字幕',   path: '#/feature/subtitle' },
      { id: 'live',     icon: 'globe',     title: '实时翻译',   desc: '看直播实时翻译',       path: '#/translate' },
    ],
  },
};

/**
 * 场景页
 * @param {string} sceneId travel | study | business | entertainment
 */
export default function ScenePage(sceneId = 'travel') {
  const config = SCENE_CONFIG[sceneId] || SCENE_CONFIG.travel;

  const page = document.createElement('div');
  page.className = 'page scene-page';

  page.innerHTML = `
    <div class="scene-hero" style="background:${config.gradient}">
      <button class="scene-back" aria-label="返回">${icon('chevronLeft', 20)}</button>
      <div class="scene-hero-content">
        <span class="scene-emoji">${config.emoji}</span>
        <h1 class="scene-title">${config.title}</h1>
        <p class="scene-desc">${config.desc}</p>
      </div>
    </div>

    <div class="scene-features">
      <h2 class="scene-features-title">推荐功能</h2>
      <div class="scene-feature-list"></div>
    </div>
  `;

  const list = page.querySelector('.scene-feature-list');
  list.innerHTML = config.features.map((f) => `
    <button class="scene-feature-card" data-path="${f.path}">
      <span class="scene-feature-ico">${icon(f.icon, 22)}</span>
      <span class="scene-feature-info">
        <span class="scene-feature-name">${f.title}</span>
        <span class="scene-feature-desc">${f.desc}</span>
      </span>
      <span class="scene-feature-arrow">${icon('chevronRight', 18)}</span>
    </button>
  `).join('');

  /* ---------- 返回 ---------- */
  page.querySelector('.scene-back').addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#/';
  });

  /* ---------- 功能卡跳转 ---------- */
  list.addEventListener('click', (e) => {
    const card = e.target.closest('.scene-feature-card');
    if (!card) return;
    location.hash = card.dataset.path;
  });

  return page;
}
