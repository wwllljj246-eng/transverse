# 译境 TransVerse — 真实功能 vs Mock 模拟功能审计报告

> 审计方式：通读 `js/` 全部 48 个源文件 + 全库扫描 `fetch` / `XMLHttpRequest` / `WebSocket` / `axios`。
> **结论：整个项目没有任何第三方 API 网络调用**。所有"AI 能力"均为本地 Mock；但大量基础能力（存储、语音输入、TTS、剪贴板、分享、拖拽、主题）使用的是**真实浏览器原生 API**，可以真正工作。

---

## 一、逐项审计明细

### 1. 文本翻译
| 项目 | 结论 |
|---|---|
| 能否工作 | ✅ 界面完整可用，❌ 翻译结果是假的 |
| 真实 API | ❌ 无 |
| Mock 方式 | `mockTranslate()`：先查 24 条硬编码短语库（英↔中/日/韩/法/德/西/意），命中返回预置译文；未命中按目标语系+语气返回固定"万能句"（如中文 natural →"好的，我明白你的意思了。"）。750ms 假加载动画 |
| JS 文件 | `js/pages/translate.js` |
| Mock 文件 | `js/data/translation-mock.js` |
| 点击后实际发生 | 校验输入 → 显示"AI 翻译中…"动画 750ms → setTimeout 返回 Mock 译文 |
| 附带的真实能力 | ⭐ **语音输入是真实的**（`SpeechRecognition`，Chrome/Edge 可用）；⭐ **发音朗读是真实的**（`speechSynthesis`）；⭐ 复制（`navigator.clipboard`）、系统分享（`navigator.share`）真实 |
| 接入真实需 | 机器翻译 API（腾讯云 TMT / DeepL / 百度翻译） |
| 后端 | 可选（直连需暴露 Key；建议后端代理） |
| API Key | ✅ 需要 |
| 浏览器权限 | 语音输入需麦克风（仅该功能） |

### 2. 拍照翻译 / OCR
| 项目 | 结论 |
|---|---|
| 能否工作 | ❌ 纯演示 |
| 真实 API | ❌ 连摄像头都没调 |
| Mock 方式 | 取景框是 CSS 渐变背景；快门点击 → 1400ms 扫描线动画 → 显示固定"日式餐厅菜单"4 张 AR 卡片（RAMEN→拉面等，位置写死）；"相册导入"也是直接触发同一动画；闪光灯只切换图标 |
| JS 文件 | `js/pages/camera.js` |
| Mock 文件 | `js/data/camera-mock.js` |
| 点击后实际发生 | `setTimeout(1400ms)` → 渲染 `CAMERA_SCENES[0]` 的固定 AR 卡片 |
| 接入真实需 | ① `getUserMedia` 或 `<input type="file" capture>` 获取图片；② OCR API（腾讯云 OCR / Google ML Kit / Tesseract.js）；③ 翻译 API |
| 后端 | OCR 建议后端代理（签名较复杂） |
| API Key | ✅ 需要 |
| 浏览器权限 | ✅ 摄像头（必须 HTTPS） |

### 3. 同声传译
| 项目 | 结论 |
|---|---|
| 能否工作 | ❌ 纯演示 |
| Mock 方式 | 预置 6 段日→中剧本 `INTERPRETER_SCRIPT`，打字机逐字输出；声波是纯 CSS 动画；"正在实时翻译"状态仅是 UI |
| JS 文件 | `js/pages/interpreter.js` |
| Mock 文件 | `js/data/speech-mock.js` |
| 点击后实际发生 | 开始 → 按剧本逐字打出原文→200ms 停顿→打出译文→下一段，播完提示保存 |
| 接入真实需 | 实时流式语音识别（浏览器 `SpeechRecognition` 可先用，进阶用腾讯云 ASR WebSocket）+ 流式翻译 API |
| 后端 | 浏览器方案不需要；云 ASR 建议 WebSocket 直连 |
| API Key | 浏览器方案不需要；云 ASR 需要 |
| 浏览器权限 | ✅ 麦克风（必须 HTTPS） |

### 4. 实时转写
| 项目 | 结论 |
|---|---|
| 能否工作 | ❌ 纯演示（计时器是真的） |
| Mock 方式 | 4 段固定中文段落逐字打出；"AI 智能整理"的会议重点/待办也是固定数据（勾选待办是真实交互） |
| JS 文件 | `js/pages/transcribe.js` |
| Mock 文件 | `js/data/speech-mock.js`（`TRANSCRIBE_SCRIPT` + `AI_SUMMARY`） |
| 点击后实际发生 | 开始 → 逐字打剧本 → 计时器走真实时间 → 完成提示；"AI 整理"展开固定内容 |
| 接入真实需 | 语音识别 + LLM 摘要 API（如混元/GPT） |
| 后端 | LLM 建议（Key 保护 + 长文本） |
| API Key | ✅ 需要 |
| 浏览器权限 | ✅ 麦克风 |

### 5. 悬浮字幕
| 项目 | 结论 |
|---|---|
| 能否工作 | ⭐ 窗口交互是真的，内容是假的 |
| Mock 方式 | 每 2.2 秒轮播固定日→中字幕对（`SUBTITLE_SCRIPT`）；"跨 App 悬浮"在浏览器技术上是做不到的（无系统级 overlay 权限） |
| JS 文件 | `js/pages/subtitle.js` |
| Mock 文件 | `js/data/dialogue-mock.js` |
| 点击后实际发生 | 进入页面即自动播放假字幕；拖动/字号/透明度/单双语/暂停均真实生效（Pointer Events） |
| 接入真实需 | 页内方案：音频流 + ASR + 翻译；真"跨 App"需原生 App 或 Electron |
| 后端 | 同传方案一致 |
| API Key | ✅ 需要 |
| 浏览器权限 | 若监听系统音频需桌面端，浏览器内仅麦克风 |

### 6. 对话翻译（面对面对话）
| 项目 | 结论 |
|---|---|
| 能否工作 | ❌ 对话流程是演示；⭐ TTS 播放是真实的 |
| Mock 方式 | `DIALOGUE_SCRIPT` 预置 A/B 轮流对话自动播放；"播放"按钮用真实 `speechSynthesis` 朗读最后一句 |
| JS 文件 | `js/pages/dialogue.js` |
| Mock 文件 | `js/data/dialogue-mock.js` |
| 点击后实际发生 | 开始 → 双方气泡按剧本轮流出现；"播放"→ 真实系统语音朗读 |
| 接入真实需 | 双向 `SpeechRecognition`（区分当前说话人）+ 翻译 API + TTS（已具备） |
| 后端 | 浏览器方案不需要 |
| API Key | 翻译 API 需要 |
| 浏览器权限 | ✅ 麦克风 |

### 7. 录音 / 语音相关
| 能力 | 状态 | 说明 |
|---|---|---|
| 语音输入（文本翻译页） | ⭐ **真实** | `SpeechRecognition`，仅 Chrome/Edge 支持，需麦克风权限 |
| 语音朗读 TTS | ⭐ **真实** | `speechSynthesis`（翻译页+对话页），依赖系统语音包 |
| 同传/转写/字幕的"语音识别" | ❌ Mock | 全部为剧本播放，未采集任何音频 |

### 8. 翻译历史记录
| 项目 | 结论 |
|---|---|
| 能否工作 | ⭐ **真实工作**（本机内） |
| 实现方式 | `localStorage` 完整 CRUD：新增/更新/删除/清空/按类型筛选，刷新不丢 |
| 注意 | 首次启动灌入的种子记录是 Mock（`history-seed.js`） |
| JS 文件 | `js/pages/history.js`、`js/pages/transcript.js` |
| Mock 文件 | `js/data/history-seed.js` |
| 接入真实需 | 跨设备同步才需后端+账号体系 |

### 9. 收藏 / 保存
| 项目 | 结论 |
|---|---|
| 能否工作 | ⭐ **真实工作**（本机内） |
| 实现方式 | `localStorage`，djb2 哈希生成稳定 ID 去重；收藏/取消即时生效 |
| 注意 | 种子收藏为 Mock |
| JS 文件 | 翻译页/记录页内联调用 |
| Mock 文件 | `js/data/favorites.js`、`js/data/history-seed.js` |

### 10. 语言选择
| 项目 | 结论 |
|---|---|
| 能否工作 | ⭐ **完全真实** |
| 实现方式 | 语言表为静态数据（正常做法）；选择/交换/最近使用/语言收藏全部真实，`localStorage` 持久化，发布订阅联动所有页面 |
| JS 文件 | `js/pages/lang-select.js`、`js/store.js` |
| Mock 文件 | 无（`data/languages.js` 属静态配置数据，非 Mock） |

### 11. 通知
| 项目 | 结论 |
|---|---|
| 能否工作 | ⭐ 本地逻辑真实；内容来源是假的 |
| 实现方式 | 已读/全部已读/未读角标/持久化均真实（`localStorage` + 订阅联动首页铃铛）；但 4 条通知是首次启动灌入的种子数据，无任何推送机制 |
| JS 文件 | `js/pages/notifications.js` |
| Mock 文件 | `js/data/notifications.js`（SEEDS） |
| 接入真实需 | Service Worker + Web Push + 后端推送服务 |

### 12. 个人中心和设置
| 子功能 | 状态 |
|---|---|
| 深色/浅色/跟随系统 | ⭐ **真实**（动态改 `data-theme`，全站生效，含系统监听） |
| 字体大小（小/标准/大） | ⭐ **真实**（CSS `--fs-scale` 实际缩放） |
| 用户名编辑 | ⭐ **真实**（持久化） |
| 清空记录 | ⭐ **真实**（确认弹窗 + 真删 localStorage） |
| 默认语言/语气/自动检测等设置 | ⭐ 真实持久化（注：默认语气等仅存储，未反哺翻译流程） |
| 使用统计 | 真实（由本地数据计算） |
| 离线语言包 | ❌ **Mock**：下载按钮只把 code 写进 localStorage，体积"48MB"等是假数据，没有任何模型文件 |
| JS 文件 | `js/pages/profile.js`、`js/pages/settings/*` |
| Mock 文件 | `js/data/offline-packs.js`、`js/data/settings.js`（部分） |

### 附加：场景模式页（旅行/学习/商务/娱乐）
静态配置 + 路由导航，全部真实跳转（`js/pages/scene.js`），无 Mock 逻辑。

---

## 二、总表

| 功能 | 当前状态 | Mock/真实 | 当前实现方式 | 变成真实功能需要什么 |
|---|---|---|---|---|
| 文本翻译 | 可用但结果是假的 | 翻译 Mock；语音输入/TTS/复制/分享真实 | 24 条短语库+语气兜底句，750ms 假加载 | 机器翻译 API（腾讯云 TMT/DeepL）+ Key；建议后端代理 |
| 拍照翻译/OCR | 演示动画 | 全 Mock | CSS 假取景框→1400ms 动画→固定日文菜单 AR 卡 | 摄像头权限(HTTPS) + OCR API + 翻译 API |
| 同声传译 | 演示动画 | 全 Mock | 6 段日→中剧本打字机播放 | 麦克风 + 流式 ASR + 流式翻译；浏览器 SpeechRecognition 可低成本起步 |
| 实时转写 | 演示动画 | 转写 Mock；计时器/待办勾选真实 | 4 段固定文案逐字打出 | 麦克风 + ASR + LLM 摘要 API（需 Key+建议后端） |
| 悬浮字幕 | 窗口真实/内容假 | 内容 Mock；拖拽/字号/透明度真实 | 2.2s 轮播固定字幕对 | 页内：ASR+翻译；跨 App 悬浮需原生端，浏览器做不到 |
| 对话翻译 | 演示+真 TTS | 剧本 Mock；speechSynthesis 真实 | A/B 气泡轮流自动播放 | 双向 SpeechRecognition + 翻译 API（TTS 已具备） |
| 语音输入 | ⭐ 真实可用 | 真实 | 浏览器 SpeechRecognition（仅 Chrome/Edge） | 无需接入，注意 HTTPS |
| 语音朗读 TTS | ⭐ 真实可用 | 真实 | 浏览器 speechSynthesis | 无需接入，依赖系统语音包 |
| 翻译历史 | ⭐ 真实可用 | 真实（种子数据 Mock） | localStorage CRUD | 跨设备同步才需后端+账号 |
| 收藏/保存 | ⭐ 真实可用 | 真实（种子数据 Mock） | localStorage + 哈希去重 | 同上 |
| 语言选择 | ⭐ 完全真实 | 真实 | localStorage + 发布订阅全站联动 | 无需 |
| 通知 | 本地逻辑真实 | 内容 Mock | localStorage + 种子通知 | Web Push + Service Worker + 后端 |
| 主题/字体/用户名/清空数据 | ⭐ 真实可用 | 真实 | localStorage + CSS 变量动态切换 | 无需 |
| 离线语言包 | 演示 | 全 Mock | localStorage 记状态，无文件下载 | 模型文件托管 + IndexedDB + WASM 推理，工作量大 |

---

## 三、毕业设计现场演示建议

### 1. 可以直接真实演示的功能（无需任何改动）
- **语言选择/交换**：全站联动、持久化
- **语音输入**（Chrome/Edge + 麦克风）：真实识别进输入框
- **译文发音 TTS**：真实朗读
- **收藏/历史/通知已读**：真实持久化，刷新不丢
- **深色模式/字体大小/用户名/清空记录**：真实生效
- **悬浮字幕窗口拖拽**：真实交互
- **文本翻译流程**：界面流畅完整（但译文内容是假的——演示时建议只输演示短语库覆盖的句子，如 "Hello, nice to meet you."）

### 2. 点击后只是模拟效果的功能
- 拍照翻译（无论拍什么都是那张日文菜单）
- 同声传译（固定日→中剧本，与说话无关）
- 实时转写 + AI 整理（固定文案和待办）
- 悬浮字幕内容（固定轮播）
- 对话翻译流程（固定剧本，仅"播放"朗读是真的）
- 离线语言包下载（只改状态，没有真实文件）

### 3. 最少接入真实 API 的优先级与技术问题清单

**推荐顺序：文本翻译 → 拍照翻译 → 实时转写**（性价比依次递减、难度依次递增）

接入前必须优先确认的技术问题：

1. **⚠️ HTTPS 强制要求（最优先）**：麦克风/摄像头/剪贴板等 API 只在安全上下文可用。当前 Cloud Studio 预览地址是 HTTP（localhost 除外）。**现场演示如果要用语音/拍照，必须部署到 HTTPS 域名**，否则直接失效。
2. **浏览器兼容性**：`SpeechRecognition` 仅 Chrome/Edge 支持（Safari 部分、Firefox 不支持）。现场演示前锁定 Chrome，并准备降级提示。
3. **API Key 安全**：纯前端直连翻译 API 会把 Key 暴露在源码里。毕业设计可用"后端简单代理（十几行 Node/云函数）"或厂商临时 Key + 演示后作废。腾讯云 TMT 有免费额度（每月 500 万字符）。
4. **CORS**：直连厂商 API 前先确认其允许浏览器跨域（多数签名接口不允许，需代理）。
5. **替换点已收敛（好消息）**：翻译只需替换 `translation-mock.js` 的 `mockTranslate()` 一个函数；OCR/语音各页面的数据源函数也都单一收口，UI 层不用动。
6. **演示网络兜底**：现场 Wi-Fi 不可控，建议提前把 API 响应验证一遍；纯 Mock 功能（同传/转写）反而离线可演，可作为网络故障时的备份演示。
