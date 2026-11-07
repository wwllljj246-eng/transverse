/* ============================================================
   同声传译 / 实时转写 Mock 剧本
   - 同声传译：分段原文 + 译文（日→中），按毫秒节奏展示
   - 实时转写：连续段落，逐字产出，配 AI 总结数据
   每段 chunk 包含：原文 / 译文 / 出现节奏（ms）
   ============================================================ */

/**
 * AI 同声传译剧本（日 → 中）
 * duration: 本段总时长 ms；segLen: 逐字拆分时每字时长
 */
export const INTERPRETER_SCRIPT = {
  id: 'interp-jp-zh',
  sourceLang: 'ja-JP',
  targetLang: 'zh-CN',
  chunks: [
    { src: 'こんにちは、皆さん。',         dst: '大家好，各位同学。',         duration: 1800, segLen: 130 },
    { src: '今日は製品の方向について、',   dst: '今天我们主要讨论产品设计方向，', duration: 2200, segLen: 110 },
    { src: '意見を交流したいと思います。', dst: '希望大家畅所欲言，交流想法。',  duration: 2100, segLen: 110 },
    { src: 'まず、ターゲットユーザーを、', dst: '首先，我们需要确定目标用户，',  duration: 2000, segLen: 110 },
    { src: '明確にする必要があります。',  dst: '并对产品首页进行调整。',       duration: 1900, segLen: 110 },
    { src: 'ありがとうございました。',     dst: '感谢各位的参与。',             duration: 1300, segLen: 110 },
  ],
};

/**
 * 实时转写剧本（中文，逐字产出）
 * segments: 段落序列；segLen: 单字出现间隔
 */
export const TRANSCRIBE_SCRIPT = {
  id: 'transcribe-zh',
  sourceLang: 'zh-CN',
  segments: [
    '今天我们主要讨论产品设计方向。',
    '首先，我们需要确定目标用户。',
    '然后对产品首页进行修改。',
    '最后完成用户测试验证。',
  ],
  segLen: 160,
};

/**
 * AI 智能整理 Mock（基于转写内容生成）
 * 由转写页点击"生成"按钮调用
 */
export const AI_SUMMARY = {
  highlights: [
    { no: 1, text: '确定目标用户' },
    { no: 2, text: '修改产品首页' },
    { no: 3, text: '完成用户测试' },
  ],
  todos: [
    { text: '完成 UI 修改', done: false },
    { text: '进行用户测试', done: false },
  ],
};
