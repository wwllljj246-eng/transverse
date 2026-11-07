# 译境 TransVerse — 交付文档

纯原生（零依赖）移动端 Web 翻译应用原型：ES Modules + Hash 路由 + CSS 设计系统，全部数据经 Mock 层驱动，开箱即可替换为真实 API。

- 演示地址（本地）：`http://localhost:8137/`
- 验收状态：5 个自动化脚本共 **279 项断言全部通过**（详见文末）

---

## 1. 运行方法

```bash
# 方式一：双击
start.bat            # 启动 http://localhost:8137/ 并自动打开浏览器

# 方式二：任意静态服务器
python -m http.server 8137
# 或 npx serve -p 8137
```

> 必须经 HTTP(S) 访问（ES Modules 不支持 file:// 协议）。无构建步骤、无 npm 依赖。

### 自动化验收（可选）

项目根目录含 5 个 Headless Chrome 验收脚本（`_harness*.html`），直接用浏览器打开即可在页面内输出 PASS/FAIL 结果：

| 脚本 | 覆盖范围 |
| --- | --- |
| `_harness.html` | 首页 / 语言选择 / 文本翻译（34 项） |
| `_harness_records.html` | 记录页三 Tab / 转写详情（64 项） |
| `_harness_profile.html` | 我的 / 设置 / 我的语言 / 深色模式（73 项） |
| `_harness_realtime.html` | 同声传译 / 实时转写 / 悬浮字幕 / 拍照（57 项） |
| `_harness_scene.html` | 场景模式 / 面对面对话（51 项） |

脚本会在启动前清空 localStorage 并注入固定初始态，结果不受运行顺序影响，可重复执行。

---

## 2. 项目结构

```
transverse/
├── index.html                 入口（首屏主题/字号预置脚本，防闪白）
├── start.bat                  一键启动
├── css/
│   ├── design-system.css      设计令牌（颜色/圆角/阴影/深浅双主题变量）
│   ├── base.css               全局骨架 / TabBar / 通用卡片
│   └── translate|realtime|records|profile|settings|dialogue.css   各域样式
└── js/
    ├── main.js                应用引导（路由挂载 + 全局事件）
    ├── router.js              Hash 路由表（16 条路由，见 §3）
    ├── store.js               语言状态（source/target/最近使用/语言收藏）
    ├── components/            跨页复用组件
    │   ├── ui.js              navBar / settingGroup / optionRow / emptyState / openSheet …
    │   ├── langcard.js flags.js icons.js tabbar.js toast.js confirm.js sheet.js
    ├── utils/dom.js           escapeHtml / formatDuration / setActiveBy / bindBack …
    ├── pages/                 页面（每页一个模块，默认导出工厂函数）
    │   └── settings/          我的 → 设置子页（6 个）
    └── data/                  数据层（Mock + 持久化，见 §5）
```

规模：JS 45 个模块约 6,600 行，CSS 8 个文件约 3,400 行。

---

## 3. 功能清单（路由表）

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 首页 | 六大功能入口、场景推荐、问候语 |
| `/translate`（`/feature/text`） | 文本翻译 | 输入即译（Mock）、语气风格、全屏结果、收藏、入库 |
| `/live` | 实时 Tab | 同传 / 转写 / 悬浮字幕入口聚合 |
| `/feature/camera` | 拍照翻译 | 沉浸式取景、Mock OCR 识别卡 |
| `/feature/interpreter` | AI 同声传译 | 双语 / 字幕 / 聚焦三模式、计时、模拟识别流 |
| `/feature/transcribe` | 实时转写 | 边录边转、结束入库、生成转写记录 |
| `/feature/dialogue` | 面对面对话 | 双人双向自动翻译、气泡会话 |
| `/feature/subtitle` | 悬浮字幕 | 模拟悬浮条双语字幕 |
| `/scene/:id` | 场景模式 | 旅行 / 学习 / 商务 / 娱乐常用语 |
| `/lang-select` | 语言选择 | 搜索、最近使用、收藏、全部语言 |
| `/history` | 记录 | 历史 / 收藏 / 转写 三 Tab，删除、清空 |
| `/transcript/:id` | 转写详情 | 全文、AI 总结、重点、待办 |
| `/profile` | 我的 | 用户卡片、统计、设置入口 |
| `/settings/languages` | 我的语言 | 统一维护「最近使用」与默认语言 |
| `/settings/offline` `/appearance` `/font` `/translate` `/about` | 设置子页 | 离线包 / 深浅主题 / 字号 / 翻译偏好 / 关于 |

全局能力：深色模式（跟随系统 + 手动，全页面适配）、三档字号、Toast / Confirm / Sheet 通用交互、localStorage 持久化。

---

## 4. 数据层与 Mock 说明

`js/data/` 下每个模块只负责一个数据域，「Mock 内容」与「持久化逻辑」分离，替换真实 API 时只需改 Mock 取数部分：

| 模块 | 数据域 | Mock 内容 | 持久化 |
| --- | --- | --- | --- |
| `translation-mock.js` | 文本翻译 | 词典 + 模糊匹配 + 语气改写 | — |
| `speech-mock.js` | 语音识别/合成 | 分段吐字的模拟识别流 | — |
| `camera-mock.js` | 拍照 OCR | 预置菜单图片识别结果 | — |
| `dialogue-mock.js` | 对话/悬浮字幕 | 双向会话脚本、字幕脚本 | — |
| `transcripts-mock.js` | 转写正文 | 总结/重点/待办生成 | — |
| `history-seed.js` | 记录种子 | 首启灌入的历史/转写样例 | 一次性 |
| `languages.js` | 语言表 | 30+ 语言（名称/国旗/Baidu 代码） | — |
| `saves.js` | 记录仓库 | — | `transverse_saves_v1` |
| `favorites.js` | 收藏 | 首启种子 | `transverse_favorites_v1` |
| `settings.js` | 偏好设置 | — | theme/font/tone/auto_detect/auto_play/default_lang/user_name |
| `store.js` | 语言状态 | — | `transverse_recent_v1` / `transverse_lang_favs_v1` |
| `offline-packs.js` | 离线包 | 包列表与进度模拟 | `transverse_offline_packs_v1` |

> 「最近使用语言」全应用只有一份数据（`store.js` 的 `transverse_recent_v1`），语言选择页与「我的语言」页共享，不存在双写。

### localStorage 键一览

`transverse_{ theme, font_size, default_tone, auto_detect, auto_play, default_lang, user_name, recent, lang_favs, saves, seeded, favorites, fav_seeded, offline_packs, visited }_v1`

---

## 5. 接入真实 API 的替换点

所有 Mock 均收敛在 `js/data/`，页面不直接写死假数据。逐域替换建议：

| 能力 | 替换点 | 建议 API |
| --- | --- | --- |
| 文本翻译 | `translation-mock.js` 的 `translate()` | 百度/腾讯/DeepL 翻译 API（语言代码已内置 Baidu 码） |
| 语音识别（同传/转写/对话） | `speech-mock.js` 的流式识别模拟 | 浏览器 `SpeechRecognition` 或云厂商实时语音识别 WebSocket |
| 语音合成 | 播报相关调用处 | `speechSynthesis` 或云厂商 TTS |
| 拍照 OCR | `camera-mock.js` | 云厂商通用 OCR（图片 base64 直传） |
| 对话/字幕脚本 | `dialogue-mock.js` | 同 ASR + 翻译 API 串联 |
| 转写总结/重点/待办 | `transcripts-mock.js` | LLM 摘要接口 |
| 记录同步 | `saves.js` / `favorites.js` | 换成后端接口，保留同签名即可（`list/get/add/update/remove/clear`） |

推荐做法：在 `js/data/` 内为每个域保留同名导出函数，内部把 Mock 实现换成 `fetch` 调用，页面层零改动。

---

## 6. 工程约定

- 每页一个模块，默认导出 `() => HTMLElement` 工厂函数；公共 UI 一律走 `components/ui.js`，禁止页面内重复内联。
- 深色模式只改 `css/design-system.css` 的 CSS 变量，页面样式禁止写死颜色。
- 模式/选项组高亮统一用 `utils/dom.js` 的 `setActiveBy()`；时长格式化统一用 `formatDuration()`。
- 所有用户输入渲染前经 `escapeHtml()` 转义。
