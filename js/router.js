/* ============================================================
   Hash 路由 — 页面注册 + 解析 + 渲染调度
   路由表：/                     首页
         /translate            文本翻译
         /feature/text         文本翻译（别名）
         /feature/camera       拍照翻译
         /feature/interpreter  AI 同声传译
         /feature/transcribe   实时转写
         /feature/dialogue     面对面对话
         /feature/subtitle     悬浮字幕
         /scene/:id            场景模式（旅行/学习/商务/娱乐）
         /live                 实时 Tab
         /history              记录 Tab（历史 / 收藏 / 转写 三 Tab）
         /transcript/:id       转写详情
         /profile              我的 Tab
         /settings/{languages|offline|appearance|font|translate|about}
         /lang-select          语言选择浮层
         /notifications        通知（占位）
   tab: 'keep' 表示保持当前 Tab 高亮不变（如语言选择浮层）
   ============================================================ */

import HomePage from './pages/home.js';
import TranslatePage from './pages/translate.js';
import CameraPage from './pages/camera.js';
import InterpreterPage from './pages/interpreter.js';
import TranscribePage from './pages/transcribe.js';
import DialoguePage from './pages/dialogue.js';
import SubtitlePage from './pages/subtitle.js';
import ScenePage from './pages/scene.js';
import HistoryPage from './pages/history.js';
import TranscriptPage from './pages/transcript.js';
import ProfilePage from './pages/profile.js';
import LivePage from './pages/live.js';
import LangSelectPage from './pages/lang-select.js';
import MyLanguagesPage from './pages/settings/my-languages.js';
import OfflinePacksPage from './pages/settings/offline-packs.js';
import AppearancePage from './pages/settings/appearance.js';
import FontSizePage from './pages/settings/font-size.js';
import TranslateSettingsPage from './pages/settings/translate-settings.js';
import AboutPage from './pages/settings/about.js';
import NotificationsPage from './pages/notifications.js';
import { createPlaceholderPage } from './pages/placeholder.js';
import { SCENES } from './data/mock.js';

function buildRoutes() {
  const routes = [
    { pattern: /^\/?$/, make: () => ({ page: HomePage(), tab: 'home' }) },

    // 文本翻译
    { pattern: /^\/translate$/, make: () => ({ page: TranslatePage(), tab: 'translate' }) },
    { pattern: /^\/feature\/text$/, make: () => ({ page: TranslatePage(), tab: 'translate' }) },

    // 实时 Tab（同声传译 / 实时转写 / 悬浮字幕入口）
    { pattern: /^\/live$/, make: () => ({ page: LivePage(), tab: 'live' }) },

    // 拍照翻译（沉浸式相机）
    { pattern: /^\/feature\/camera$/, make: () => ({ page: CameraPage(), tab: 'home' }) },

    // AI 同声传译
    { pattern: /^\/feature\/interpreter$/, make: () => ({ page: InterpreterPage(), tab: 'live' }) },

    // 实时转写
    { pattern: /^\/feature\/transcribe$/, make: () => ({ page: TranscribePage(), tab: 'live' }) },

    // 面对面对话
    { pattern: /^\/feature\/dialogue$/, make: () => ({ page: DialoguePage(), tab: 'home' }) },

    // 悬浮字幕
    { pattern: /^\/feature\/subtitle$/, make: () => ({ page: SubtitlePage(), tab: 'home' }) },

    // 场景模式（旅行 / 学习 / 商务 / 娱乐）
    ...SCENES.map((s) => ({
      pattern: new RegExp(`^\\/scene\\/${s.id}$`),
      make: () => ({ page: ScenePage(s.id), tab: 'home' }),
    })),

    // 语言选择（保持来源 Tab 高亮）
    { pattern: /^\/lang-select(?:\?side=(source|target))?$/, make: (m) => ({
        page: LangSelectPage(m[1] || 'source'), tab: 'keep' }) },

    { pattern: /^\/notifications$/, make: () => ({ page: NotificationsPage(), tab: 'home' }) },

    // 记录页（历史 / 收藏 / 转写 三 Tab）
    { pattern: /^\/history$/, make: () => ({ page: HistoryPage(), tab: 'history' }) },

    // 转写详情（完整转写内容 + AI 总结 + 重点 + 待办）
    { pattern: /^\/transcript\/([^/]+)$/, make: (m) => ({
        page: TranscriptPage(m[1]), tab: 'history' }) },

    // 我的
    { pattern: /^\/profile$/, make: () => ({ page: ProfilePage(), tab: 'profile' }) },

    // 设置子页（统一回到「我的」）
    { pattern: /^\/settings\/languages$/, make: () => ({ page: MyLanguagesPage(), tab: 'profile' }) },
    { pattern: /^\/settings\/offline$/, make: () => ({ page: OfflinePacksPage(), tab: 'profile' }) },
    { pattern: /^\/settings\/appearance$/, make: () => ({ page: AppearancePage(), tab: 'profile' }) },
    { pattern: /^\/settings\/font$/, make: () => ({ page: FontSizePage(), tab: 'profile' }) },
    { pattern: /^\/settings\/translate$/, make: () => ({ page: TranslateSettingsPage(), tab: 'profile' }) },
    { pattern: /^\/settings\/about$/, make: () => ({ page: AboutPage(), tab: 'profile' }) },
  ];

  // 说明：首页六大功能（text/camera/interpreter/transcribe/dialogue/subtitle）
  // 与四个场景均已在上方逐条注册，不再需要按 FEATURES 生成占位路由。

  return routes;
}

const routes = buildRoutes();

/** 解析当前 hash → { make, params } 或 null（未匹配） */
export function resolve() {
  const path = (location.hash || '#/').slice(1);
  for (const r of routes) {
    const m = path.match(r.pattern);
    if (m) return { make: r.make, params: m };
  }
  return null;
}
